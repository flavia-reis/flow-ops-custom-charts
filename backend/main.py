from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Flow Ops Backend", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FLOW_API_BASE_URL = os.getenv("FLOW_API_BASE_URL", "https://flow.ciandt.com/flow-ops-api")
FLOW_TOKEN = os.getenv("FLOW_TOKEN", "")

if not FLOW_TOKEN:
    logger.error("FLOW_TOKEN not configured in environment variables")


@app.get("/")
async def root():
    return {"message": "Flow Ops Backend API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "flow-ops-backend"}


@app.get("/api/v1/raw-data")
async def get_raw_data(
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    items_per_page: int = Query(10, ge=1, le=100)
):
    """Get raw data from Flow API"""
    
    if not FLOW_TOKEN:
        logger.error("API call attempted without FLOW_TOKEN configured")
        raise HTTPException(status_code=500, detail="FLOW_TOKEN not configured")
    
    url = f"{FLOW_API_BASE_URL}/api/v1/metrics/productivity/burn/raw-data"
    
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {FLOW_TOKEN}"
    }
    
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "page": page,
        "items_per_page": items_per_page
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Successfully retrieved {len(data.get('items', []))} items from Flow API")
                return data
            else:
                logger.error(f"Flow API returned status {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Flow API error: {response.text}"
                )
                
    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to Flow API: {str(e)}")
        raise HTTPException(status_code=504, detail="Timeout connecting to Flow API")
    except httpx.RequestError as e:
        logger.error(f"Network error connecting to Flow API: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in get_raw_data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)