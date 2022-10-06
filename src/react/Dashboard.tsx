import * as React from "react";
import { InstanceGrid } from "./Instance/InstanceGrid";
import { AddInstanceBtn } from "./Instance/AddInstanceBtn";

export function Dashboard() {
	return (
		<>
			<InstanceGrid />
			<AddInstanceBtn />
		</>
	);
}
