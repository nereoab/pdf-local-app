"""
Google Analytics 4 (GA4) MCP Server
Enables AI agents to query Google Analytics 4 performance and realtime data directly via MCP.
Provides tools for realtime metrics, traffic sources, top pages, events, and demographics.
"""

import os
import sys
import json
from typing import List, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("google-analytics")

# Resolve credentials & default property
DEFAULT_KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gsc-credentials.json")
CREDENTIALS_FILE = os.environ.get("GA4_CREDENTIALS_PATH", DEFAULT_KEY_PATH)
DEFAULT_PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "548228704")

SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly"
]

_cached_service = None

def get_service():
    """Builds and returns the authenticated Google Analytics Data API service (cached)."""
    global _cached_service
    if _cached_service is not None:
        return _cached_service

    if not os.path.exists(CREDENTIALS_FILE):
        raise FileNotFoundError(f"Google Service Account key file not found at: {CREDENTIALS_FILE}")
    
    creds = service_account.Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    _cached_service = build("analyticsdata", "v1beta", credentials=creds, cache_discovery=False)
    return _cached_service


def normalize_property(property_id: str) -> str:
    """Ensures the property string is in 'properties/123456789' format."""
    cleaned = property_id.strip()
    if not cleaned.startswith("properties/"):
        return f"properties/{cleaned}"
    return cleaned


@mcp.tool()
def get_realtime_overview(property_id: str = DEFAULT_PROPERTY_ID) -> str:
    """
    Queries active users on the site in real time (last 30 minutes) broken down by page and country.
    
    Args:
        property_id: The GA4 Property ID (default: '548228704').
    """
    try:
        service = get_service()
        prop = normalize_property(property_id)

        # 1. Overall active users
        total_req = {
            "metrics": [{"name": "activeUsers"}]
        }
        total_res = service.properties().runRealtimeReport(property=prop, body=total_req).execute()
        total_active = 0
        if total_res.get("rows"):
            total_active = int(total_res["rows"][0]["metricValues"][0].get("value", 0))

        # 2. Breakdown by page and country
        detail_req = {
            "dimensions": [{"name": "unifiedScreenName"}, {"name": "country"}],
            "metrics": [{"name": "activeUsers"}],
            "limit": 20
        }
        detail_res = service.properties().runRealtimeReport(property=prop, body=detail_req).execute()
        
        breakdown = []
        for row in detail_res.get("rows", []):
            breakdown.append({
                "page": row["dimensionValues"][0].get("value", ""),
                "country": row["dimensionValues"][1].get("value", ""),
                "activeUsers": int(row["metricValues"][0].get("value", 0))
            })

        return json.dumps({
            "status": "success",
            "property": prop,
            "totalActiveUsers": total_active,
            "activeBreakdown": breakdown
        }, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def get_traffic_overview(
    property_id: str = DEFAULT_PROPERTY_ID,
    start_date: str = "28daysAgo",
    end_date: str = "today"
) -> str:
    """
    Queries traffic channels (Organic Search, Direct, Social, Referral) and high-level KPI metrics.
    
    Args:
        property_id: The GA4 Property ID (default: '548228704').
        start_date: Start date e.g. '28daysAgo', '7daysAgo', or 'YYYY-MM-DD' (default: '28daysAgo').
        end_date: End date e.g. 'today', 'yesterday', or 'YYYY-MM-DD' (default: 'today').
    """
    try:
        service = get_service()
        prop = normalize_property(property_id)

        body = {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "dimensions": [{"name": "sessionDefaultChannelGroup"}],
            "metrics": [
                {"name": "activeUsers"},
                {"name": "newUsers"},
                {"name": "sessions"},
                {"name": "screenPageViews"},
                {"name": "averageSessionDuration"},
                {"name": "bounceRate"}
            ],
            "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}]
        }

        res = service.properties().runReport(property=prop, body=body).execute()
        
        channels = []
        for row in res.get("rows", []):
            channels.append({
                "channel": row["dimensionValues"][0].get("value", ""),
                "activeUsers": int(row["metricValues"][0].get("value", 0)),
                "newUsers": int(row["metricValues"][1].get("value", 0)),
                "sessions": int(row["metricValues"][2].get("value", 0)),
                "pageViews": int(row["metricValues"][3].get("value", 0)),
                "avgDurationSec": round(float(row["metricValues"][4].get("value", 0)), 1),
                "bounceRate": f"{float(row['metricValues'][5].get('value', 0)) * 100:.1f}%"
            })

        return json.dumps({
            "status": "success",
            "property": prop,
            "period": {"startDate": start_date, "endDate": end_date},
            "channels": channels
        }, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def get_top_pages(
    property_id: str = DEFAULT_PROPERTY_ID,
    start_date: str = "28daysAgo",
    end_date: str = "today",
    limit: int = 25
) -> str:
    """
    Queries the most viewed pages/tools with pageviews, active users, and average engagement time.
    
    Args:
        property_id: The GA4 Property ID (default: '548228704').
        start_date: Start date e.g. '28daysAgo' or 'YYYY-MM-DD'.
        end_date: End date e.g. 'today' or 'YYYY-MM-DD'.
        limit: Max number of pages to return (default: 25).
    """
    try:
        service = get_service()
        prop = normalize_property(property_id)

        body = {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "dimensions": [{"name": "pagePath"}, {"name": "pageTitle"}],
            "metrics": [
                {"name": "screenPageViews"},
                {"name": "activeUsers"},
                {"name": "userEngagementDuration"}
            ],
            "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
            "limit": limit
        }

        res = service.properties().runReport(property=prop, body=body).execute()
        
        pages = []
        for row in res.get("rows", []):
            views = int(row["metricValues"][0].get("value", 0))
            users = int(row["metricValues"][1].get("value", 0))
            duration = float(row["metricValues"][2].get("value", 0))
            avg_duration = round(duration / users, 1) if users > 0 else 0
            
            pages.append({
                "path": row["dimensionValues"][0].get("value", ""),
                "title": row["dimensionValues"][1].get("value", ""),
                "pageViews": views,
                "activeUsers": users,
                "avgEngagementSec": avg_duration
            })

        return json.dumps({
            "status": "success",
            "property": prop,
            "period": {"startDate": start_date, "endDate": end_date},
            "pages": pages
        }, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def get_demographics(
    property_id: str = DEFAULT_PROPERTY_ID,
    start_date: str = "28daysAgo",
    end_date: str = "today",
    limit: int = 25
) -> str:
    """
    Queries users by country and device category (desktop vs mobile vs tablet).
    
    Args:
        property_id: The GA4 Property ID (default: '548228704').
        start_date: Start date e.g. '28daysAgo' or 'YYYY-MM-DD'.
        end_date: End date e.g. 'today' or 'YYYY-MM-DD'.
        limit: Max rows (default: 25).
    """
    try:
        service = get_service()
        prop = normalize_property(property_id)

        body = {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "dimensions": [{"name": "country"}, {"name": "deviceCategory"}],
            "metrics": [
                {"name": "activeUsers"},
                {"name": "sessions"}
            ],
            "orderBys": [{"metric": {"metricName": "activeUsers"}, "desc": True}],
            "limit": limit
        }

        res = service.properties().runReport(property=prop, body=body).execute()
        
        rows = []
        for row in res.get("rows", []):
            rows.append({
                "country": row["dimensionValues"][0].get("value", ""),
                "device": row["dimensionValues"][1].get("value", ""),
                "activeUsers": int(row["metricValues"][0].get("value", 0)),
                "sessions": int(row["metricValues"][1].get("value", 0))
            })

        return json.dumps({
            "status": "success",
            "property": prop,
            "period": {"startDate": start_date, "endDate": end_date},
            "demographics": rows
        }, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def get_events_summary(
    property_id: str = DEFAULT_PROPERTY_ID,
    start_date: str = "28daysAgo",
    end_date: str = "today",
    limit: int = 25
) -> str:
    """
    Queries GA4 events (page_view, session_start, user_engagement, custom conversions, etc.).
    
    Args:
        property_id: The GA4 Property ID (default: '548228704').
        start_date: Start date e.g. '28daysAgo' or 'YYYY-MM-DD'.
        end_date: End date e.g. 'today' or 'YYYY-MM-DD'.
        limit: Max rows (default: 25).
    """
    try:
        service = get_service()
        prop = normalize_property(property_id)

        body = {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "dimensions": [{"name": "eventName"}],
            "metrics": [
                {"name": "eventCount"},
                {"name": "totalUsers"}
            ],
            "orderBys": [{"metric": {"metricName": "eventCount"}, "desc": True}],
            "limit": limit
        }

        res = service.properties().runReport(property=prop, body=body).execute()
        
        events = []
        for row in res.get("rows", []):
            events.append({
                "eventName": row["dimensionValues"][0].get("value", ""),
                "count": int(row["metricValues"][0].get("value", 0)),
                "users": int(row["metricValues"][1].get("value", 0))
            })

        return json.dumps({
            "status": "success",
            "property": prop,
            "period": {"startDate": start_date, "endDate": end_date},
            "events": events
        }, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


if __name__ == "__main__":
    mcp.run()
