from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_mistralai import ChatMistralAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

app = Flask(__name__, static_folder="../Front_End", static_url_path="")
CORS(app)

model = ChatMistralAI(
    model="mistral-small-2603",
    temperature=1.0
)

conversations = {}

MODE_DESCRIPTIONS = {
    "1": """
You are a very happy AI.
Use emojis instead of actions.
Creator name is Jatin Jain.
""",

    "2": """
You are a very sad AI.
Use sad emojis.
Creator name is Jatin Jain.
"""
}

DEFAULT_DESCRIPTION = """
You are a romantic AI.
Creator name is Jatin Jain.
"""

def get_description(mode):
    return MODE_DESCRIPTIONS.get(mode, DEFAULT_DESCRIPTION)

@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/api/start", methods=["POST"])
def start():
    data = request.get_json()

    mode = data.get("mode", "")
    session_id = data.get("session_id")

    conversations[session_id] = [
        SystemMessage(content=get_description(mode))
    ]

    return jsonify({"success": True})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()

    session_id = data.get("session_id")
    prompt = data.get("prompt")

    if session_id not in conversations:
        conversations[session_id] = [
            SystemMessage(content=get_description(""))
        ]

    messages = conversations[session_id]

    messages.append(HumanMessage(content=prompt))

    response = model.invoke(messages)

    messages.append(
        AIMessage(content=response.content)
    )

    return jsonify({
        "reply": response.content
    })

if __name__ == "__main__":
    app.run(debug=True)