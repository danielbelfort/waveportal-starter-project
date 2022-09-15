import React from "react";
import Wave from "./Wave"

export default function WaveList({ waveList }) {
	if (!waveList) {
		return null;
	}

	return (
    <div>
			{waveList.map((wave) => (
				<Wave
          key={wave.timestamp}
					address={wave.address}
          timestamp={wave.timestamp}
					message={wave.message}
				/>
			)).reverse()}
		</div>
	);
}