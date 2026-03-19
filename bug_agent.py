import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

def analyze_code(code: str) -> str:
    """
    Sends the user code to the OpenRouter AI model and returns the analysis.
    """
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Bug Finder Agent"
    }

    prompt = f"""
You are an expert software debugger.

Find bugs, logical errors, and security issues in this code.
Also suggest fixes. and also explain the code in simple words. 
and also tell me how to improve the code. and also tell me how to optimize the code. 
and also tell me how to make the code more efficient. 
and also tell the time and space complexity of the code.

Code:
{code}
"""

    data = {
        "model": "stepfun/step-3.5-flash:free",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        if "choices" not in result:
            return "Error: AI model returned an unexpected format."
            
        return result["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        return f"Error connecting to AI service: {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"