// src/components/courses/DiscussionBoard.tsx
import React from "react";

type DiscussionBoardProps = {
  courseId: string;
};

const DiscussionBoard: React.FC<DiscussionBoardProps> = ({ courseId }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-2">Discussion Board</h2>
      <p className="text-gray-600">
        Discussion board for course <span className="font-semibold">{courseId}</span> is under
        construction 🚧
      </p>
    </div>
  );
};

export default DiscussionBoard;
