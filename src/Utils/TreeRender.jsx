// TreeRenderer.js
import React from 'react';

export function renderTree(node) {
    if (!node) return null;

    return (
        <div className="treeNodeStyle">
            <div className="nodeStyle">
                {node.value}{node.varValue !== null ? `[${node.varValue}]` : ''}
            </div>

            <div className="childrenContainerStyle">
                {node.left && (
                    <div className="branchStyleLeft">
                        {renderTree(node.left)}
                    </div>
                )}
                {node.right && (
                    <div className="branchStyleRight">
                        {renderTree(node.right)}
                    </div>
                )}
            </div>
        </div>
    );
}
