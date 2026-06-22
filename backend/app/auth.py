from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from .extensions import db
from .models import User

auth_bp = Blueprint("auth", __name__)


def bad_request(message, status=400):
    return {"message": message}, status


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return bad_request("Name, email, and password are required.")
    if len(password) < 6:
        return bad_request("Password must be at least 6 characters.")
    if User.query.filter_by(email=email).first():
        return bad_request("An account with this email already exists.", 409)

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return {"token": token, "user": user.to_dict()}, 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return bad_request("Invalid email or password.", 401)

    token = create_access_token(identity=str(user.id))
    return {"token": token, "user": user.to_dict()}


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return {"user": user.to_dict()}
