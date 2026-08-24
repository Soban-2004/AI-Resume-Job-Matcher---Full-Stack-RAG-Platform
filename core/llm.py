from langchain_groq import ChatGroq
import streamlit as st

@st.cache_resource
def load_llm():
    return ChatGroq(
    groq_api_key=st.secrets["GROQ_API_KEY"],
    # llama-3.1-8b-instant was deprecated by Groq on 2026-08-16; this is
    # their recommended replacement (console.groq.com/docs/deprecations).
    model_name="openai/gpt-oss-20b"
)