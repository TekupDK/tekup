from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import os
import uuid

from .database import get_db, Lead as LeadModel, create_tables

app = FastAPI(title="RestaurantIQ API", version="0.1.0", docs_url="/docs", redoc_url="/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
create_tables()

# Pydantic models
class LeadCreate(BaseModel):
    restaurant_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    interest_level: Optional[str] = "medium"  # low, medium, high
    notes: Optional[str] = None

class Lead(BaseModel):
    id: str
    restaurant_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    interest_level: str = "medium"
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

@app.get("/healthz")
def healthz(db: Session = Depends(get_db)):
    leads_count = db.query(LeadModel).count()
    return {
        "status": "ok",
        "service": "restaurantiq-api",
        "env": os.getenv("ENV", "dev"),
        "leads_count": leads_count
    }

@app.get("/")
def root():
    return {"message": "RestaurantIQ API up", "docs": "/docs"}

@app.post("/leads", response_model=Lead)
def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    """Create a new restaurant lead"""
    db_lead = LeadModel(
        restaurant_name=lead_data.restaurant_name,
        contact_name=lead_data.contact_name,
        email=lead_data.email,
        phone=lead_data.phone,
        city=lead_data.city,
        interest_level=lead_data.interest_level,
        notes=lead_data.notes
    )
    
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    return Lead(
        id=str(db_lead.id),
        restaurant_name=db_lead.restaurant_name,
        contact_name=db_lead.contact_name,
        email=db_lead.email,
        phone=db_lead.phone,
        city=db_lead.city,
        interest_level=db_lead.interest_level,
        notes=db_lead.notes,
        created_at=db_lead.created_at,
        updated_at=db_lead.updated_at
    )

@app.get("/leads", response_model=List[Lead])
def get_leads(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    """Get all restaurant leads with pagination"""
    db_leads = db.query(LeadModel).offset(offset).limit(limit).all()
    
    return [
        Lead(
            id=str(lead.id),
            restaurant_name=lead.restaurant_name,
            contact_name=lead.contact_name,
            email=lead.email,
            phone=lead.phone,
            city=lead.city,
            interest_level=lead.interest_level,
            notes=lead.notes,
            created_at=lead.created_at,
            updated_at=lead.updated_at
        )
        for lead in db_leads
    ]

@app.get("/leads/{lead_id}", response_model=Lead)
def get_lead(lead_id: str, db: Session = Depends(get_db)):
    """Get a specific lead by ID"""
    db_lead = db.query(LeadModel).filter(LeadModel.id == int(lead_id)).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return Lead(
        id=str(db_lead.id),
        restaurant_name=db_lead.restaurant_name,
        contact_name=db_lead.contact_name,
        email=db_lead.email,
        phone=db_lead.phone,
        city=db_lead.city,
        interest_level=db_lead.interest_level,
        notes=db_lead.notes,
        created_at=db_lead.created_at,
        updated_at=db_lead.updated_at
    )

@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    """Delete a lead by ID"""
    db_lead = db.query(LeadModel).filter(LeadModel.id == int(lead_id)).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    db.delete(db_lead)
    db.commit()
    return {"message": "Lead deleted", "deleted_lead_id": lead_id}