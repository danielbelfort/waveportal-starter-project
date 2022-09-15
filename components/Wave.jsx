import React from "react";

export default function Wave( {address, timestamp, message} ) {
  return (
    <div style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
      <div><b>Address</b>: {address}</div>
      <div><b>Time</b>: {timestamp.toString()}</div>
      <div><b>Message</b>: {message}</div>
    </div>
  );
}