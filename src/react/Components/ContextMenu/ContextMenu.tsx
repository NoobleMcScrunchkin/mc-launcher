import * as React from "react";
import * as ReactDOM from "react-dom";

export function ContextMenu(props: any) {
	const nodeRef = React.useRef();
	const [visible, setVisible] = React.useState<boolean>(false);
	const [x, setX] = React.useState<number>(0);
	const [y, setY] = React.useState<number>(0);
	const [startWidth, setStartWidth] = React.useState<number>(0);
	const [startHeight, setStartHeight] = React.useState<number>(0);

	const handleClicks = (event: MouseEvent) => {
		if (!ReactDOM.findDOMNode(nodeRef.current).contains(event.target as HTMLElement)) {
			event.preventDefault();
			setVisible(false);
			(ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement).classList.remove("no-hover");
		}

		if (ReactDOM.findDOMNode(nodeRef.current).contains(event.target as HTMLElement)) {
			if (event.which == 1) {
				setTimeout(() => {
					setVisible(false);
				}, 500);
			}
			return;
		}

		if (event.which == 3) {
			if ((event.target as HTMLElement) == (ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement) || (ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement).contains(event.target as HTMLElement)) {
				event.preventDefault();
				let ex = event.clientX;
				let ey = event.clientY;

				setX(0);
				setY(0);
				setVisible(true);

				if (ex + startWidth > window.innerWidth) {
					ex = window.innerWidth - startWidth;
				}

				if (ey + (ReactDOM.findDOMNode(nodeRef.current) as HTMLDivElement).clientHeight > window.innerHeight) {
					ey = window.innerHeight - startHeight;
				}

				setX(ex);
				setY(ey);
				setVisible(true);
				(ReactDOM.findDOMNode(nodeRef.current).parentNode as HTMLElement).classList.add("no-hover");
			}
		}
	};

	React.useEffect(() => {
		setStartWidth((ReactDOM.findDOMNode(nodeRef.current) as HTMLDivElement).clientWidth + 8);
		setStartHeight((ReactDOM.findDOMNode(nodeRef.current) as HTMLDivElement).clientHeight + 8);

		document.body.addEventListener("mousedown", handleClicks);

		return () => {
			document.body.removeEventListener("mousedown", handleClicks);
		};
	}, [visible, startWidth, startHeight]);

	return (
		<>
			<div ref={nodeRef} className="context-menu" style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none", top: y, left: x }}>
				<div className="context-menu-title">{props.title}</div>
				{props.children}
			</div>
		</>
	);
}
