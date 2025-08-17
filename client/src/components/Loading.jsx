import React from "react";

function Loading() {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-blue-600">Thinking...</span>
    </div>
  );
}

export default Loading;

