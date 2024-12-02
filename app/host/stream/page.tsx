"use client";
import React, { useState } from "react";

function Page() {
  const streams = [
    "KzKvPrIPVbE?si=4MwpzftZFNMwp7zQ",
    "Ko18SgceYX8?si=6-dSIAutDRRLumPm",
    "1wECsnGZcfc?si=x4Q3U4GSR_i2jmR1",
    "TOJQkhzpLyQ?si=E-j1Q46euLmN79xZ",
    "tgBTspqA5nY?si=PQRzaUHNeXpU_dFs",
    "YGEgelAiUf0?si=d2hnci_ik9vAhRWk",
    "GIT1lX0NdHo?si=qQ8MgDBMK5jZ0d3f",
    "wq0ecjkN3G8?si=Lyhh3bKbK7vTLV_K",
  ];

  const [currentPage, setCurrentPage] = React.useState(1);
  const streamPerPage = 4;

  const totalPages = Math.ceil(streams.length / streamPerPage);

  const indexOfLastStream = currentPage * streamPerPage;
  const indexOfFirstStream = indexOfLastStream - streamPerPage;
  const currentStream = streams.slice(indexOfFirstStream, indexOfLastStream);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="bg-gray-900 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 justify-items-center gap-y-5">
        {currentStream.map((stream, index) => (
          <iframe
            key={index}
            width="730"
            height="350"
            src={`https://www.youtube.com/embed/${stream}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        ))}
      </div>
      <div className="flex  justify-center  mt-8 mx-10 ">
        <button
          onClick={handlePreviousPage}
          className="px-4 py-2 rounded text-white bg-black"
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="px-4 py-2">{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          onClick={handleNextPage}
          className="px-4 py-2 rounded text-white bg-black"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Page;
