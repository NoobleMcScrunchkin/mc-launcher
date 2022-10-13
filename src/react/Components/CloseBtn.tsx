import * as React from "react";
import { Link } from "react-router-dom";

export function CloseBtn() {
	return (
		<>
			<Link to={"/"} className="close-btn hover-text">
				<div className="close-btn hover-text">
					<i className="fa-solid fa-xmark"></i>
				</div>
			</Link>
		</>
	);
}
