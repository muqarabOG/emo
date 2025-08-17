import React from "react";
import Loading from "./Loading";

function AIResponse({ response }) {
  if (!response) return null;
  return (
    <div className="mt-4 p-4 border rounded bg-blue-50">
      <strong>AI says:</strong>{" "}
      {response === "Thinking..." ? <Loading /> : response}
    </div>
  );
}

export default AIResponse;
