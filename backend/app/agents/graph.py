"""
LangGraph Multi-Agent Orchestration Graph
Assembles the sequential agent pipeline:
Classifier -> Summarizer -> Dedup -> Triage
"""
from typing import Dict, Any, List
from collections import defaultdict
from app.agents.state import PipelineState, ClusterData
from app.agents.classifier import classify_clusters
from app.agents.summarizer import summarize_clusters
from app.agents.dedup import dedup_clusters
from app.agents.triage import triage_clusters

def build_agent_graph():
    """
    Builds and compiles the LangGraph StateGraph.
    Falls back gracefully to a direct sequential pipeline execution if langgraph is not installed.
    """
    try:
        from langgraph.graph import StateGraph, END

        workflow = StateGraph(PipelineState)

        # Add Nodes
        workflow.add_node("classifier", classify_clusters)
        workflow.add_node("summarizer", summarize_clusters)
        workflow.add_node("dedup", dedup_clusters)
        workflow.add_node("triage", triage_clusters)

        # Set Entry and Edges
        workflow.set_entry_point("classifier")
        workflow.add_edge("classifier", "summarizer")
        workflow.add_edge("summarizer", "dedup")
        workflow.add_edge("dedup", "triage")
        workflow.add_edge("triage", END)

        return workflow.compile()
    except Exception as e:
        print(f"[LangGraph] Notice: Using internal pipeline runner: {e}")
        return None

compiled_graph = build_agent_graph()

def run_multi_agent_pipeline(user_id: str, clustered_emails: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes the multi-agent pipeline over clustered emails.
    """
    # Group emails by cluster_id
    grouped = defaultdict(list)
    for email in clustered_emails:
        c_id = email.get("cluster_id", "cluster_0")
        grouped[c_id].append(email)

    clusters: Dict[str, ClusterData] = {}
    for c_id, email_list in grouped.items():
        clusters[c_id] = {
            "cluster_id": c_id,
            "emails": email_list,
            "category_name": "",
            "narrative_summary": "",
            "redundancy_info": {},
            "suggested_action": "keep",
            "confidence_score": 0.0,
            "estimated_size_mb": 0.0
        }

    initial_state: PipelineState = {
        "user_id": user_id,
        "raw_emails": clustered_emails,
        "clusters": clusters,
        "logs": ["Pipeline initialized."]
    }

    if compiled_graph:
        try:
            result = compiled_graph.invoke(initial_state)
            return result
        except Exception as e:
            print(f"[LangGraph] Execution error, running step-by-step: {e}")

    # Step-by-step execution fallback
    s1 = classify_clusters(initial_state)
    initial_state["clusters"].update(s1["clusters"])
    initial_state["logs"].extend(s1["logs"])

    s2 = summarize_clusters(initial_state)
    initial_state["clusters"].update(s2["clusters"])
    initial_state["logs"].extend(s2["logs"])

    s3 = dedup_clusters(initial_state)
    initial_state["clusters"].update(s3["clusters"])
    initial_state["logs"].extend(s3["logs"])

    s4 = triage_clusters(initial_state)
    initial_state["clusters"].update(s4["clusters"])
    initial_state["logs"].extend(s4["logs"])

    return initial_state
