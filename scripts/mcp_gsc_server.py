"""
Google Search Console MCP Server
Enables AI agents to query Google Search Console directly via MCP.
Provides tools for search analytics, URL inspection, and sitemap management.
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import List, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("google-search-console")

# Resolve credentials
DEFAULT_KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "gsc-credentials.json")
CREDENTIALS_FILE = os.environ.get("GSC_CREDENTIALS_PATH", DEFAULT_KEY_PATH)

SCOPES = [
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/webmasters.readonly"
]

def get_service():
    """Builds and returns the authenticated Google Search Console service."""
    if not os.path.exists(CREDENTIALS_FILE):
        raise FileNotFoundError(f"Google Service Account key file not found at: {CREDENTIALS_FILE}")
    
    creds = service_account.Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


@mcp.tool()
def list_properties() -> str:
    """Lists all verified sites and domain properties in Google Search Console."""
    try:
        service = get_service()
        result = service.sites().list().execute()
        entries = result.get("siteEntry", [])
        if not entries:
            return json.dumps({"status": "empty", "message": "No sites found in site list, but you may have access to specific domain properties like sc-domain:pdf-black.com."}, indent=2)
        return json.dumps({"status": "success", "sites": entries}, indent=2)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def query_search_analytics(
    site_url: str = "sc-domain:pdf-black.com",
    start_date: str = "",
    end_date: str = "",
    dimensions: Optional[List[str]] = None,
    row_limit: int = 25,
    search_type: str = "web",
    dimension_filter_group: Optional[dict] = None
) -> str:
    """
    Queries Google Search Console performance data (clicks, impressions, CTR, position).
    
    Args:
        site_url: The site URL or domain property (e.g. 'sc-domain:pdf-black.com').
        start_date: Start date in YYYY-MM-DD format (defaults to 28 days ago).
        end_date: End date in YYYY-MM-DD format (defaults to yesterday).
        dimensions: List of dimensions to group by. Supported: ['query'], ['page'], ['country'], ['device'], ['date'].
        row_limit: Maximum number of rows to return (up to 5000, default 25).
        search_type: 'web', 'image', 'video', 'news', 'discover', or 'googleNews'.
        dimension_filter_group: Optional dictionary with custom filters.
    """
    try:
        service = get_service()
        
        # Default dates (last 28 days up to yesterday)
        today = datetime.utcnow().date()
        if not end_date:
            end_date = (today - timedelta(days=2)).strftime("%Y-%m-%d")
        if not start_date:
            start_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
            
        if dimensions is None:
            dimensions = ["query"]

        body = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": dimensions,
            "rowLimit": min(row_limit, 5000),
            "type": search_type
        }
        
        if dimension_filter_group:
            body["dimensionFilterGroups"] = [dimension_filter_group]

        response = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
        rows = response.get("rows", [])
        
        # Format metrics cleanly
        formatted_rows = []
        for r in rows:
            formatted_rows.append({
                "keys": r.get("keys", []),
                "clicks": r.get("clicks", 0),
                "impressions": r.get("impressions", 0),
                "ctr": f"{r.get('ctr', 0) * 100:.2f}%",
                "position": round(r.get("position", 0), 1)
            })

        return json.dumps({
            "status": "success",
            "siteUrl": site_url,
            "period": {"startDate": start_date, "endDate": end_date},
            "total_rows": len(formatted_rows),
            "data": formatted_rows
        }, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def inspect_url(
    inspection_url: str,
    site_url: str = "sc-domain:pdf-black.com"
) -> str:
    """
    Inspects a specific URL to see its live Google indexing status, crawl date, canonical URL, and coverage verdict.
    
    Args:
        inspection_url: The full URL to inspect (e.g. 'https://pdf-black.com/convertir/pdf-excel').
        site_url: The domain property or site URL (default: 'sc-domain:pdf-black.com').
    """
    try:
        service = get_service()
        body = {
            "inspectionUrl": inspection_url,
            "siteUrl": site_url
        }
        result = service.urlInspection().index().inspect(body=body).execute()
        index_result = result.get("inspectionResult", {})
        status_result = index_result.get("indexStatusResult", {})
        
        simplified = {
            "url": inspection_url,
            "verdict": status_result.get("verdict"),
            "coverageState": status_result.get("coverageState"),
            "indexingState": status_result.get("indexingState"),
            "robotsTxtState": status_result.get("robotsTxtState"),
            "pageFetchState": status_result.get("pageFetchState"),
            "googleCanonical": status_result.get("googleCanonical"),
            "userCanonical": status_result.get("userCanonical"),
            "lastCrawlTime": status_result.get("lastCrawlTime"),
            "crawledAs": status_result.get("crawledAs"),
            "referringUrls": status_result.get("referringUrls", [])[:5],
            "inspectionResultLink": index_result.get("inspectionResultLink")
        }
        return json.dumps({"status": "success", "inspection": simplified}, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def list_sitemaps(site_url: str = "sc-domain:pdf-black.com") -> str:
    """
    Lists all submitted sitemaps for the site and their processing/crawl status.
    
    Args:
        site_url: The domain property or site URL (default: 'sc-domain:pdf-black.com').
    """
    try:
        service = get_service()
        response = service.sitemaps().list(siteUrl=site_url).execute()
        sitemaps = response.get("sitemap", [])
        return json.dumps({"status": "success", "siteUrl": site_url, "sitemaps": sitemaps}, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


@mcp.tool()
def submit_sitemap(
    feedpath: str = "https://pdf-black.com/sitemap.xml",
    site_url: str = "sc-domain:pdf-black.com"
) -> str:
    """
    Submits a sitemap to Google Search Console for indexing.
    
    Args:
        feedpath: Full URL of the sitemap (e.g. 'https://pdf-black.com/sitemap.xml').
        site_url: The domain property or site URL (default: 'sc-domain:pdf-black.com').
    """
    try:
        service = get_service()
        service.sitemaps().submit(siteUrl=site_url, feedpath=feedpath).execute()
        return json.dumps({"status": "success", "message": f"Sitemap {feedpath} submitted successfully to {site_url}."}, indent=2)
    except Exception as e:
        return json.dumps({"status": "error", "error": str(e)}, indent=2)


if __name__ == "__main__":
    mcp.run(transport="stdio")
