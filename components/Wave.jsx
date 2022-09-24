import React from "react";
import dayjs from "dayjs";

export default function Wave( {address, timestamp, message} ) {
  return (
    <div className="wavebox">
      <div>{message}</div>
      <br></br>
      <div style={{fontSize: "small"}}>
        <div><b>From</b>: {address}</div>
        <div><b>Time</b>: {formatDate(timestamp)} at {formatTime(timestamp)}</div>
      </div>
    </div>
  );
}

function formatDate(timestamp) {
	return dayjs(timestamp).format("MMM D, YYYY");
}

function formatTime(timestamp) {
	return dayjs(timestamp).format("h:mm:ss a");
}