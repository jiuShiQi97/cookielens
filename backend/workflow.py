from typing import TypedDict
from langgraph.graph import StateGraph, END
from scanner import scan_website
from compliance import check_compliance, analyze_third_parties


class ScanState(TypedDict):
    url: str
    frameworks: list
    scan_results: dict
    compliance_results: dict
    third_party_risks: list
    error: str


def scan_site(state: ScanState) -> ScanState:
    try:
        scan_data = scan_website(state['url'])
        state['scan_results'] = scan_data
    except Exception as e:
        state['error'] = str(e)
    return state


def check_compliance_node(state: ScanState) -> ScanState:
    if state.get('error'):
        return state
    
    try:
        results = check_compliance(state['scan_results'], state.get('frameworks'))
        state['compliance_results'] = results
    except Exception as e:
        state['error'] = str(e)
    return state


def analyze_risks(state: ScanState) -> ScanState:
    if state.get('error'):
        return state
    
    try:
        third_parties = state['scan_results'].get('thirdParties', [])
        state['third_party_risks'] = analyze_third_parties(third_parties)
    except Exception as e:
        state['error'] = str(e)
    return state


def build_workflow():
    workflow = StateGraph(ScanState)
    
    workflow.add_node("scan", scan_site)
    workflow.add_node("compliance", check_compliance_node)
    workflow.add_node("risks", analyze_risks)
    
    workflow.set_entry_point("scan")
    workflow.add_edge("scan", "compliance")
    workflow.add_edge("compliance", "risks")
    workflow.add_edge("risks", END)
    
    return workflow.compile()


def run_compliance_scan(url: str, frameworks: list = None):
    app = build_workflow()
    
    initial_state = {
        "url": url,
        "frameworks": frameworks or ['gdpr', 'ccpa'],
        "scan_results": {},
        "compliance_results": {},
        "third_party_risks": [],
        "error": None
    }
    
    result = app.invoke(initial_state)
    
    if result.get('error'):
        raise Exception(result['error'])
    
    return {
        'scan_results': result['scan_results'],
        'compliance_analysis': result['compliance_results'],
        'third_party_risks': result['third_party_risks']
    }

