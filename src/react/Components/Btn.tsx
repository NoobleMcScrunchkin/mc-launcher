import * as React from "react";

export function Btn(props: any) {
    return (
        <>
            <div style={props.style} onClick={props.onClick} className={props.className + " btn hover-border"}>
                {props.children}
            </div>
        </>
    );
}