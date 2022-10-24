import * as React from "react";
import { Link } from "react-router-dom";

export function AddInstanceBtn(props: any) {
	return (
		<>
			<Link to={"/instanceCreator"}>
				<div className="add-btn hover-border hover-text">
					<i className="fa-solid fa-plus"></i>
				</div>
			</Link>
		</>
	);
}
