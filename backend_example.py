# Example Python Backend for NaviPRO
# This shows how to handle JWT tokens from the auth backend

from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import requests
from functools import wraps

app = Flask(__name__)
CORS(app)

# Configuration
AUTH_BACKEND_URL = "https://naviproai-1.onrender.com"
SECRET_KEY = "your-secret-key"  # This should match your auth backend

def verify_jwt_token(token):
    """
    Verify JWT token with the auth backend
    """
    try:
        # Option 1: Verify token locally if you have the secret key
        # payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        
        # Option 2: Verify token with auth backend (recommended)
        response = requests.get(
            f"{AUTH_BACKEND_URL}/auth/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
            
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def require_auth(f):
    """
    Decorator to require JWT authentication
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"error": "No authorization header"}), 401
        
        try:
            token = auth_header.split(" ")[1]  # Remove "Bearer " prefix
            user_data = verify_jwt_token(token)
            
            if not user_data:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Add user data to request context
            request.user = user_data
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({"error": "Invalid token format"}), 401
    
    return decorated_function

@app.route('/api/user_roadmap', methods=['GET'])
@require_auth
def get_user_roadmap():
    """
    Get user's learning roadmap
    """
    user_id = request.user.get('user_id') or request.user.get('id')
    
    # Here you would fetch the roadmap from your database using user_id
    # For now, returning a sample roadmap
    roadmap = {
        "user_id": user_id,
        "goal": "Learn full-stack development",
        "target_role": "Full Stack Developer",
        "timeframe": "6_months",
        "hours_per_week": "10",
        "learning_style": "visual",
        "learning_speed": "average",
        "skill_level": "beginner",
        "phases": [
            {
                "phase": 1,
                "title": "Frontend Fundamentals",
                "duration": "8 weeks",
                "tasks": [
                    {"task": "Learn HTML basics", "completed": True},
                    {"task": "Master CSS styling", "completed": False},
                    {"task": "JavaScript fundamentals", "completed": False}
                ]
            },
            {
                "phase": 2,
                "title": "Backend Development",
                "duration": "10 weeks",
                "tasks": [
                    {"task": "Node.js basics", "completed": False},
                    {"task": "Express.js framework", "completed": False},
                    {"task": "Database design", "completed": False}
                ]
            }
        ]
    }
    
    return jsonify(roadmap)

@app.route('/api/generate_roadmap', methods=['POST'])
@require_auth
def generate_roadmap():
    """
    Generate a new learning roadmap for the user
    """
    user_id = request.user.get('user_id') or request.user.get('id')
    data = request.json
    
    # Here you would use AI/ML to generate a personalized roadmap
    # based on the user's preferences and goals
    
    # Store the roadmap in your database with user_id
    roadmap = {
        "user_id": user_id,
        "goal": data.get('goal'),
        "target_role": data.get('target_role'),
        "timeframe": data.get('timeframe'),
        "hours_per_week": data.get('hours_per_week'),
        "learning_style": data.get('learning_style'),
        "learning_speed": data.get('learning_speed'),
        "skill_level": data.get('skill_level'),
        "phases": [
            # Generated phases would go here
        ]
    }
    
    # Save to database
    # save_roadmap_to_database(roadmap)
    
    return jsonify({
        "success": True,
        "roadmap": roadmap,
        "message": "Roadmap generated successfully"
    })

@app.route('/api/complete_task', methods=['POST'])
@require_auth
def complete_task():
    """
    Mark a task as completed
    """
    user_id = request.user.get('user_id') or request.user.get('id')
    data = request.json
    
    task_id = data.get('task_id')
    phase_id = data.get('phase_id')
    
    # Here you would update the task completion status in your database
    # update_task_completion(user_id, phase_id, task_id, completed=True)
    
    return jsonify({
        "success": True,
        "message": "Task marked as completed"
    })

@app.route('/api/user_progress', methods=['GET'])
@require_auth
def get_user_progress():
    """
    Get user's learning progress
    """
    user_id = request.user.get('user_id') or request.user.get('id')
    
    # Here you would calculate progress from your database
    # For now, returning sample data
    progress = {
        "user_id": user_id,
        "overall_progress": 35,
        "phases_completed": 1,
        "total_tasks": 20,
        "completed_tasks": 7,
        "current_phase": 2,
        "estimated_completion": "4 months"
    }
    
    return jsonify(progress)

@app.route('/api/course_recommendations', methods=['GET'])
@require_auth
def get_course_recommendations():
    """
    Get personalized course recommendations for the user
    """
    user_id = request.user.get('user_id') or request.user.get('id')
    
    # Here you would use the user's learning preferences and progress
    # to recommend relevant courses
    
    recommendations = [
        {
            "id": 1,
            "title": "Complete Web Development Bootcamp",
            "platform": "Udemy",
            "rating": 4.8,
            "duration": "44 hours",
            "price": "$29.99",
            "relevance_score": 95,
            "url": "https://udemy.com/course/complete-web-development-bootcamp"
        },
        {
            "id": 2,
            "title": "JavaScript: The Complete Guide",
            "platform": "Coursera",
            "rating": 4.7,
            "duration": "32 hours",
            "price": "Free",
            "relevance_score": 88,
            "url": "https://coursera.org/learn/javascript-complete-guide"
        }
    ]
    
    return jsonify({
        "user_id": user_id,
        "recommendations": recommendations
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
