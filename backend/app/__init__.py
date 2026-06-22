from flask import Flask
from flask.cli import with_appcontext
from flask_cors import CORS
import click

from .auth import auth_bp
from .config import Config
from .extensions import db, jwt
from .models import Transaction, User
from .reports import reports_bp
from .transactions import transactions_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.cli.command("init-db")
    @with_appcontext
    def init_db_command():
        db.create_all()
        click.echo("Database initialized.")

    return app
