from datetime import date

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_

from .extensions import db
from .models import Transaction

transactions_bp = Blueprint("transactions", __name__)

VALID_TYPES = {"income", "expense", "saving"}
DEFAULT_CATEGORIES = {"Food", "Shopping", "Bills", "Travel", "Health", "Education", "Salary", "Savings", "Other"}


def current_user_id():
    return int(get_jwt_identity())


def parse_date(value):
    if not value:
        return date.today()
    return date.fromisoformat(value)


def apply_filters(query):
    tx_type = request.args.get("type")
    category = request.args.get("category")
    search = request.args.get("search")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if tx_type:
        query = query.filter(Transaction.type == tx_type)
    if category:
        query = query.filter(Transaction.category == category)
    if start_date:
        query = query.filter(Transaction.transaction_date >= parse_date(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= parse_date(end_date))
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(or_(Transaction.title.ilike(like), Transaction.note.ilike(like)))
    return query


def validate_payload(data):
    title = (data.get("title") or "").strip()
    tx_type = (data.get("type") or "").strip()
    category = (data.get("category") or "").strip()

    if not title:
        return "Title is required."
    if tx_type not in VALID_TYPES:
        return "Type must be income, expense, or saving."
    if not category:
        return "Category is required."
    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return "Amount must be a number."
    if amount <= 0:
        return "Amount must be greater than zero."
    try:
        parse_date(data.get("transaction_date"))
    except ValueError:
        return "Transaction date must be YYYY-MM-DD."
    return None


@transactions_bp.get("")
@jwt_required()
def list_transactions():
    query = Transaction.query.filter_by(user_id=current_user_id())
    query = apply_filters(query).order_by(Transaction.transaction_date.desc(), Transaction.id.desc())
    items = query.all()
    return {"transactions": [item.to_dict() for item in items]}


@transactions_bp.post("")
@jwt_required()
def create_transaction():
    data = request.get_json() or {}
    error = validate_payload(data)
    if error:
        return {"message": error}, 400

    item = Transaction(
        user_id=current_user_id(),
        title=data["title"].strip(),
        amount=float(data["amount"]),
        type=data["type"],
        category=data["category"].strip(),
        note=(data.get("note") or "").strip(),
        transaction_date=parse_date(data.get("transaction_date")),
    )
    db.session.add(item)
    db.session.commit()
    return {"transaction": item.to_dict()}, 201


@transactions_bp.put("/<int:transaction_id>")
@jwt_required()
def update_transaction(transaction_id):
    item = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id()).first_or_404()
    data = request.get_json() or {}
    error = validate_payload(data)
    if error:
        return {"message": error}, 400

    item.title = data["title"].strip()
    item.amount = float(data["amount"])
    item.type = data["type"]
    item.category = data["category"].strip()
    item.note = (data.get("note") or "").strip()
    item.transaction_date = parse_date(data.get("transaction_date"))
    db.session.commit()
    return {"transaction": item.to_dict()}


@transactions_bp.delete("/<int:transaction_id>")
@jwt_required()
def delete_transaction(transaction_id):
    item = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id()).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return {"message": "Transaction deleted."}


@transactions_bp.get("/categories")
@jwt_required()
def categories():
    return {"categories": sorted(DEFAULT_CATEGORIES)}
