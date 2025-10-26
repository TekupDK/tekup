import os
import json
import aiohttp

BASE_URL = os.environ.get("TEKUP_API_URL", "http://localhost:3000/api")
TENANT_ID = os.environ.get("TEKUP_TENANT_ID", "test-tenant")

class TekupUnifiedAPI:
    def __init__(self):
        self.base = BASE_URL
        self.headers = {
            "Content-Type": "application/json",
            "x-tenant-id": TENANT_ID,
        }

    async def create_lead(self, lead):
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base}/leads", headers=self.headers, data=json.dumps(lead)) as r:
                r.raise_for_status()
                return await r.json()

    async def score_lead(self, lead_id):
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base}/leads/{lead_id}/score", headers=self.headers, data="{}") as r:
                r.raise_for_status()
                return await r.json()

    async def qualify_lead(self, lead_id, payload):
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base}/leads/{lead_id}/qualify", headers=self.headers, data=json.dumps(payload)) as r:
                r.raise_for_status()
                return await r.json()

    async def convert_lead(self, lead_id, payload):
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base}/leads/{lead_id}/convert", headers=self.headers, data=json.dumps(payload)) as r:
                r.raise_for_status()
                return await r.json()

