import React from "react";

function InputForm({ prompt, setPrompt, handleSubmit, loading }) {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-6">
      <input
        className="border border-gray-300 rounded p-2"
        placeholder="Write your thoughts here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Send to AI"}
      </button>
    </form>
  );
}

export default InputForm;
