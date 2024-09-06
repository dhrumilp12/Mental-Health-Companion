from .user import user_routes
from .ai import ai_routes
from .check_in import check_in_routes
from .search import search_routes

def register_blueprints(app):
    """Register Flask blueprints."""
    app.register_blueprint(user_routes)
    app.register_blueprint(ai_routes)
    app.register_blueprint(check_in_routes)
    app.register_blueprint(search_routes)
