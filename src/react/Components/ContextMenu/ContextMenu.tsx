import * as React from "react";
import * as ReactDOM from "react-dom";

export function ContextMenu(props: any) {
	const nodeRef = React.useRef();
	const [visible, setVisible] = React.useState<boolean>(false);
	const [x, setX] = React.useState<number>(0);
	const [y, setY] = React.useState<number>(0);

	const handleClicks = (event: MouseEvent) => {
		if (!ReactDOM.findDOMNode(nodeRef.current).contains(event.target as HTMLElement)) {
			event.preventDefault();
			setVisible(false);
			(ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement).classList.remove("no-hover");
		}

		if (event.which == 3) {
			if ((event.target as HTMLElement) == (ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement) || (ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement).contains(event.target as HTMLElement)) {
				event.preventDefault();
				let x = event.clientX;
				let y = event.clientY;

				if (x + (ReactDOM.findDOMNode(nodeRef.current) as HTMLDivElement).clientWidth > window.innerWidth) {
					x = window.innerWidth - (ReactDOM.findDOMNode(nodeRef.current) as HTMLDivElement).clientWidth;
				}

				if (y + (ReactDOM.findDOMNode(nodeRef.current) as HTMLDivElement).clientHeight > window.innerHeight) {
					y = window.innerHeight - (ReactDOM.findDOMNode(nodeRef.current) as HTMLDivElement).clientHeight;
				}

				setX(x);
				setY(y);
				setVisible(true);
				(ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement).classList.add("no-hover");
			}
		}
	};

	React.useEffect(() => {
		document.body.addEventListener("mousedown", handleClicks);

		return () => {
			document.body.removeEventListener("mousedown", handleClicks);
		};
	}, [visible]);

	if (!visible) {
		return <div ref={nodeRef}></div>;
	}

	return (
		<>
			<div ref={nodeRef} className="context-menu" style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none", top: y, left: x }}>
				<div className="context-menu-title">{props.title}</div>
				{props.children}
			</div>
		</>
	);
}
