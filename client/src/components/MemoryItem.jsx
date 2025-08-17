import React from "react";

function MemoryItem({ mem }) {
  return (
    <li className="p-3 border rounded bg-white shadow-sm hover:shadow-md transition">
      <div><strong>You:</strong> {mem.message}</div>
      <div><strong>AI:</strong> {mem.reply}</div>
      <div className="text-sm text-gray-500 mt-1">
        {new Date(mem.date).toLocaleString()}
      </div>
    </li>
  );
}

export default MemoryItem;

