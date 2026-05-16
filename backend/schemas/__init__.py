# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\schemas\__init__.py
from .property_schemas import PropertyCreate, PropertyUpdate, PropertyResponse, PropertyDetailResponse, RoomConfig, FloorConfig
from .tenant_schemas import TenantCreate, TenantUpdate, TenantTransfer, TenantResponse
from .room_schemas import RoomCreate, RoomUpdate, RoomResponse
from .complaint_schemas import ComplaintCreate, ComplaintUpdate, ComplaintStatusPatch, ComplaintResponse
from .notice_schemas import NoticeCreate, NoticeResponse
from .rent_schemas import RentTransactionCreate, RentTransactionResponse
from .staff_schemas import StaffCreate, StaffUpdate, StaffResponse
from .auth_schemas import OwnerSignup, OwnerLogin, OTPVerify, TenantLogin
from .ai_schemas import AIChatRequest, AIAgentRequest, AIInsightResponse, AIBroadcastRequest
