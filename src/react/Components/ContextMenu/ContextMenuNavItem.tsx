import * as React from "react";
import { Link } from "react-router-dom";

export function ContextMenuNavItem(props: any) {
	const getListItem = () => {
		return (
			<div className={"context-menu-item hover-text" + (props.className ? ` ${props.className}` : "")}>
				<div className="context-menu-item-icon">{props.icon}</div>
				<div className="context-menu-item-desc">{props.children}</div>
			</div>
		);
	};

	if (props.to) {
		return (
			<>
				<Link to={props.to}>{getListItem()}</Link>
			</>
		);
	} else {
		return getListItem();
	}
}
