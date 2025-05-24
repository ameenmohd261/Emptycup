from flask import Flask, jsonify, send_from_directory, request, make_response
from flask_cors import CORS
import os
import json
import time
import logging
from werkzeug.exceptions import NotFound

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('emptycup_app')

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend')
CORS(app)  # Enable CORS for all routes

# Constants
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
LISTINGS_FILE = os.path.join(DATA_DIR, 'listings.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Routes
@app.route('/')
def index():
    """Serve the main HTML page"""
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except NotFound:
        logger.error("index.html not found in static folder")
        return make_response("Frontend files not found. Check server configuration.", 404)

@app.route('/api/listings')
def get_listings():
    """API endpoint to fetch all designer listings"""
    try:
        # Add a small delay to simulate network latency for better UX testing
        if app.debug:
            time.sleep(0.5)
        
        # Check if listings file exists
        if not os.path.exists(LISTINGS_FILE):
            create_sample_data()
        
        # Load and return listings
        with open(LISTINGS_FILE, 'r') as f:
            listings = json.load(f)
        
        return jsonify(listings)
    
    except Exception as e:
        logger.error(f"Error retrieving listings: {str(e)}")
        return jsonify({
            'error': 'Failed to load listings',
            'message': str(e)
        }), 500

@app.route('/api/listings/<int:listing_id>')
def get_listing(listing_id):
    """API endpoint to fetch a specific designer listing"""
    try:
        # Check if listings file exists
        if not os.path.exists(LISTINGS_FILE):
            create_sample_data()
        
        # Load listings
        with open(LISTINGS_FILE, 'r') as f:
            listings = json.load(f)
        
        # Find the requested listing
        listing = next((item for item in listings if item['id'] == listing_id), None)
        
        if listing:
            return jsonify(listing)
        else:
            return jsonify({'error': 'Listing not found'}), 404
    
    except Exception as e:
        logger.error(f"Error retrieving listing {listing_id}: {str(e)}")
        return jsonify({
            'error': f'Failed to load listing {listing_id}',
            'message': str(e)
        }), 500

@app.route('/api/shortlist', methods=['POST'])
def update_shortlist():
    """API endpoint to toggle shortlist status (not used in frontend but available)"""
    try:
        data = request.json
        listing_id = data.get('id')
        shortlisted = data.get('shortlisted')
        
        # This would typically update a database
        # For this demo, we just return success
        return jsonify({
            'success': True,
            'id': listing_id,
            'shortlisted': shortlisted
        })
    
    except Exception as e:
        logger.error(f"Error updating shortlist: {str(e)}")
        return jsonify({
            'error': 'Failed to update shortlist',
            'message': str(e)
        }), 500

# Serve static files
@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from the frontend directory"""
    try:
        return send_from_directory(app.static_folder, filename)
    except NotFound:
        logger.warning(f"Static file not found: {filename}")
        return make_response(f"File {filename} not found.", 404)

def create_sample_data():
    """Create sample data if it doesn't exist"""
    sample_data = [
        {
            "id": 1,
            "name": "Epic Designs",
            "rating": 4,
            "description": "Passionate team of 4 designers working out of Bangalore with an experience of 4 years.",
            "projects": 57,
            "experience": 8,
            "price": 2,
            "phone1": "+91 - 984532853",
            "phone2": "+91 - 984532854"
        },
        {
            "id": 2,
            "name": "Studio - D3",
            "rating": 5,
            "description": "Passionate team of 4 designers working out of Bangalore with an experience of 4 years.",
            "projects": 43,
            "experience": 6,
            "price": 3,
            "phone1": "+91 - 984532853",
            "phone2": "+91 - 984532854"
        },
        {
            "id": 3,
            "name": "Design Masters",
            "rating": 3,
            "description": "Creative team specialized in modern and minimalist designs based in Mumbai.",
            "projects": 32,
            "experience": 5,
            "price": 1,
            "phone1": "+91 - 987654321",
            "phone2": "+91 - 987654320"
        },
        {
            "id": 4,
            "name": "Artful Interiors",
            "rating": 4,
            "description": "Expert interior designers with a flair for contemporary and fusion styles.",
            "projects": 48,
            "experience": 7,
            "price": 3,
            "phone1": "+91 - 998765432",
            "phone2": "+91 - 998765431"
        },
        {
            "id": 5,
            "name": "Urban Spaces",
            "rating": 5,
            "description": "Modern design studio focused on maximizing space with innovative solutions.",
            "projects": 62,
            "experience": 10,
            "price": 2,
            "phone1": "+91 - 976543210",
            "phone2": "+91 - 976543211"
        }
    ]
    
    with open(LISTINGS_FILE, 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    logger.info(f"Created sample data at {LISTINGS_FILE}")

# Run the app
if __name__ == '__main__':
    # Create sample data if it doesn't exist
    if not os.path.exists(LISTINGS_FILE):
        create_sample_data()
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 't')
    
    logger.info(f"Starting EmptyCup server on port {port}, debug={debug}")
    app.run(host='0.0.0.0', port=port, debug=debug)