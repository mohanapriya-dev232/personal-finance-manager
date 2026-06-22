from calendar import monthrange
from datetime import date
from io import BytesIO

from flask import Blueprint, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy import extract

from .models import Transaction

reports_bp = Blueprint("reports", __name__)


def user_id():
    return int(get_jwt_identity())


def month_parts(value):
    if not value:
        today = date.today()
        return today.year, today.month
    year, month = value.split("-")
    return int(year), int(month)


def monthly_transactions(year, month):
    return (
        Transaction.query.filter(
            Transaction.user_id == user_id(),
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .order_by(Transaction.transaction_date.asc(), Transaction.id.asc())
        .all()
    )


def summarize(items):
    total_income = sum(float(i.amount) for i in items if i.type == "income")
    total_expense = sum(float(i.amount) for i in items if i.type == "expense")
    total_saving = sum(float(i.amount) for i in items if i.type == "saving")
    by_category = {}
    for item in items:
        if item.type == "expense":
            by_category[item.category] = by_category.get(item.category, 0) + float(item.amount)
    return {
        "income": total_income,
        "expense": total_expense,
        "saving": total_saving,
        "balance": total_income - total_expense - total_saving,
        "expense_by_category": [{"category": key, "amount": value} for key, value in sorted(by_category.items())],
    }


@reports_bp.get("/monthly")
@jwt_required()
def monthly_report():
    year, month = month_parts(request.args.get("month"))
    items = monthly_transactions(year, month)
    days = monthrange(year, month)[1]
    return {
        "month": f"{year}-{month:02d}",
        "period": {"start": f"{year}-{month:02d}-01", "end": f"{year}-{month:02d}-{days}"},
        "summary": summarize(items),
        "transactions": [item.to_dict() for item in items],
    }


@reports_bp.get("/pdf")
@jwt_required()
def pdf_report():
    year, month = month_parts(request.args.get("month"))
    items = monthly_transactions(year, month)
    summary = summarize(items)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Personal Finance Monthly Report", styles["Title"]),
        Paragraph(f"Month: {year}-{month:02d}", styles["Normal"]),
        Spacer(1, 16),
    ]

    summary_data = [
        ["Income", f"{summary['income']:.2f}"],
        ["Expenses", f"{summary['expense']:.2f}"],
        ["Savings", f"{summary['saving']:.2f}"],
        ["Balance", f"{summary['balance']:.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[160, 160])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story += [summary_table, Spacer(1, 20)]

    rows = [["Date", "Title", "Type", "Category", "Amount"]]
    rows += [[i.transaction_date.isoformat(), i.title, i.type, i.category, f"{float(i.amount):.2f}"] for i in items]
    table = Table(rows, repeatRows=1, colWidths=[75, 150, 70, 95, 80])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (4, 1), (4, -1), "RIGHT"),
    ]))
    story.append(table)
    doc.build(story)

    buffer.seek(0)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"expense-report-{year}-{month:02d}.pdf",
    )
