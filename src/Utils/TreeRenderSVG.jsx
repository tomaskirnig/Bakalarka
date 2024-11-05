import React from 'react';

export function TreeSVG({ tree }) {
    // Recursive function to calculate and render nodes and lines
    const renderTree = (node, x, y, level = 1) => {
        if (!node) return null;

        const nodeRadius = 20; // Radius of each node
        const verticalSpacing = 80; // Vertical distance between levels
        const horizontalSpacing = 3 / level; // Horizontal spacing based on depth

        const leftX = x - horizontalSpacing * 50;
        const rightX = x + horizontalSpacing * 50;
        const childY = y + verticalSpacing;

        const textColor = "#F0EDEE"; //2C666E
        const lineColor = "#0A090C"; // Line color
        const nodeColor = "#07393C"; //90DDF0
        const backgroundColor = "#07393C";

        return (
            <g key={node.value + x + y}>
                {/* Render the current node */}
                <circle cx={x} cy={y} r={nodeRadius} fill={nodeColor} stroke="#333" strokeWidth="2" />
                <text x={x} y={y} fill={textColor} fontSize="14" textAnchor="middle" dy=".3em">
                    {node.value}{node.varValue !== null ? `[${node.varValue}]` : ''}
                </text>

                {/* Render left child and line if it exists */}
                {node.left && (
                    <>
                        <line x1={x} y1={y + nodeRadius} x2={leftX} y2={childY - nodeRadius} stroke={lineColor} strokeWidth="2" />
                        {renderTree(node.left, leftX, childY, level + 1)}
                    </>
                )}

                {/* Render right child and line if it exists */}
                {node.right && (
                    <>
                        <line x1={x} y1={y + nodeRadius} x2={rightX} y2={childY - nodeRadius} stroke={lineColor} strokeWidth="2" />
                        {renderTree(node.right, rightX, childY, level + 1)}
                    </>
                )}
            </g>
        );
    };

    return (
        <>
            <hr />
            <svg
                width="800"
                height="600"
                style={{
                    // backgroundColor: "#07393C",
                    borderRadius: "10px",
                    // border: "1px solid #333",
                    margin: "20px auto",
                }}
            >
                {tree && renderTree(tree, 400, 50)} {/* Start drawing from the top center */}
            </svg>
        </>
    );
}

export default TreeSVG;
