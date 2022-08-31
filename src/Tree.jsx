import React, { useReducer, useState } from "react"
import * as Utils from "./TreeUtils"
import Node from "./Node"
import { useEffect } from "react"

const Tree = () => {
	const [viewMode, setViewMode] = useState("bst")
	const [inputText, setInputText] = useState("")
	const [nodes, setNodes] = useState([])
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const [lines, setLines] = useState([])
	const [lineInProgress, setLineInProgress] = useState()
	const [, forceUpdate] = useReducer(x => x + 1, 0)
	// Seed ensures that all nodes re-render when a new node is added to preserve consistency in their props
	const [seed, setSeed] = useState(Math.random())

	const insertBSTNode = value => {
		if (nodes.length === 0) {
			let newNode = { value: value, id: Math.random(), children: [], parentID: null }
			newNode.topOffset = 40
			newNode.leftOffset = (document.getElementById("treeView").clientWidth - 25) / 2

			setNodes([newNode])
		} else {
			const newNode = Utils.bstInsert(nodes[0], value)

			setNodes([newNode])
			setLines(Utils.generateLines(newNode))
		}
	}

	const insertBinaryNode = value => {
		if (nodes.length === 0) {
			let newNode = { value: value, id: Math.random(), children: [], parentID: null }
			newNode.topOffset = 40
			newNode.leftOffset = (document.getElementById("treeView").clientWidth - 25) / 2

			setNodes([newNode])
		} else {
			// This function updates nodes and has a callback to setLines, so there is no need to call setNodes
			const newNode = Utils.binaryInsert(nodes[0], value)

			setNodes([newNode])
			setLines(Utils.generateLines(newNode))
		}
	}

	const insertAVLNode = value => {
		if (nodes.length === 0) {
			let newNode = { value: value, id: Math.random(), children: [], parentID: null }
			newNode.topOffset = 40
			newNode.leftOffset = (document.getElementById("treeView").clientWidth - 25) / 2

			setNodes([newNode])
		} else {
			const inserted = Utils.bstInsert(nodes[0], value)
			const newNode = Utils.avlBalance(inserted)

			setNodes([newNode])
			setLines(Utils.generateLines(newNode))
		}
	}

	const insertCustomNode = value => {
		let newNode = { value: value, id: Math.random(), children: [], parentID: null }

		if (nodes.length === 0) {
			newNode.topOffset = 40
			newNode.leftOffset = (document.getElementById("treeView").clientWidth - 25) / 2

			setNodes([newNode])
		} else {
			let allNodes = []
			nodes.forEach(tree => allNodes.push(...Utils.flattenTree(tree)))
			// Check for duplicate entry attempt
			if (allNodes.reduce((rsf, node) => rsf || node.value === value, false)) {
				// TODO: Handle duplicate node entry attempt with animation
				console.log("Attempted duplicate entry")
			} else {
				const treeViewBox = document.getElementById("treeView").getBoundingClientRect()
				newNode.topOffset = nodes[nodes.length - 1].topOffset
				newNode.leftOffset = Utils.dimensionClamp(nodes[nodes.length - 1].leftOffset + 80, treeViewBox.left, treeViewBox.right - 50)
				setNodes([...nodes, newNode])
			}
		}
	}

	const handleViewModeChange = e => {
		setViewMode(e.target.value)
	}

	const handleInputChange = e => {
		// Verify input is numeric before accepting update
		const inputRegex = /(?:\d+(?:\.\d*)?)?/
		const matches = e.target.value.match(inputRegex)

		if (matches !== null && e.target.value.length === matches[0].length) {
			setInputText(e.target.value)
		}
	}

	const handleNodeClick = e => {
		setLines(lines.filter(l => l.parentID !== +e.target.parentNode.parentNode.id && l.childID !== +e.target.parentNode.parentNode.id))
		setNodes(Utils.searchNodesAndRemoveById(nodes, e.target.parentNode.parentNode.id))
	}

	const handleLineClick = e => {
		// Find IDs of parent and child nodes connecting to the clicked line
		const [parentID, childID] = e.target.id.split("-")
		// Since there is no guarantee we have a structured tree, gather all nodes in an array
		let allNodes = []
		nodes.forEach(tree => allNodes.push(...Utils.flattenTree(tree)))
		// Find node object corresponding to the child connected to the clicked line
		const childNode = allNodes.find(node => node.id === +childID)

		// Switch viewMode if currently in a structured tree mode
		if (viewMode === "bst" || viewMode === "avl" || viewMode === "redblack" || viewMode === "binary") {
			setViewMode("custom")
		}
		// Re-structure the nodes state and remove the clicked line
		const removed = Utils.searchNodesAndRemoveById(nodes, childID)
		childNode.parentID = null
		setNodes([...removed, childNode])
		setLines(lines.filter(line => line.childID !== +childID || line.parentID !== +parentID))
	}

	const handleLineInProgressClick = () => {
		// This shouldn't be necessary, but it is here just in case
		setLineInProgress()
	}

	const handleInsertClick = () => {
		if (inputText === "") return

		// Update the tree nodes
		if (viewMode === "bst") {
			insertBSTNode(+inputText)
		} else if (viewMode === "binary") {
			insertBinaryNode(+inputText)
		} else if (viewMode === "avl") {
			insertAVLNode(+inputText)
		} else if (viewMode === "custom") {
			insertCustomNode(+inputText)
		}
		// Clear the input text bar
		setInputText("")
	}

	const handleDragStart = e => {
		setDragOffset({
			x: e.nativeEvent.offsetX,
			y: e.nativeEvent.offsetY,
		})
	}

	useEffect(() => {
		setSeed(Math.random())
	}, [nodes])

	const handleDragEnd = e => {}

	const handleDrag = e => {
		// This if statement filters out the last drag event which has coordinates (0, 0)
		if (!(e.clientX === 0 && e.clientY === 0)) {
			// Find the moved node in the tree and update its position
			let allNodes = []
			nodes.forEach(tree => allNodes.push(...Utils.flattenTree(tree)))
			const nodeObj = allNodes.find(node => node.id === +e.target.parentNode.parentNode.id)

			// Keep the node in the treeView area
			const desiredTopOffset = e.pageY - dragOffset.y - 25
			const desiredLeftOffset = e.pageX - dragOffset.x
			const treeViewBox = document.getElementById("treeView").getBoundingClientRect()
			nodeObj.topOffset = Utils.dimensionClamp(desiredTopOffset, treeViewBox.top - 25, treeViewBox.bottom - 50)
			nodeObj.leftOffset = Utils.dimensionClamp(desiredLeftOffset, treeViewBox.left, treeViewBox.right - 50)

			// Re-render the moved node
			forceUpdate()
		}
	}

	return (
		<div id="tree">
			<div className="topBar">
				<input onChange={handleInputChange} value={inputText} />
				<button onClick={handleInsertClick}>Insert</button>
				<button>Search</button>
				<select name="treeMode" value={viewMode} onChange={handleViewModeChange}>
					<option value="redblack">Tree format: Red-Black</option>
					<option value="avl">Tree format: AVL</option>
					<option value="bst">Tree format: BST</option>
					<option value="binary">Tree format: Binary</option>
					<option value="custom">Tree format: Custom</option>
				</select>
			</div>
			<div id="treeView">
				{nodes.map(value => (
					<Node
						onClick={handleNodeClick}
						onDrag={handleDrag}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
						for={value}
						row={1}
						key={value.id + seed}
						viewMode={viewMode}
						stateData={{
							nodes: nodes,
							setNodes: setNodes,
							lines: lines,
							setLines: setLines,
							setLineInProgress: setLineInProgress,
						}}
					/>
				))}
				<svg>
					{lines.map(l => {
						// Flatten every tree on the page
						let flattenedTree = []
						for (let i = 0; i < nodes.length; i++) {
							flattenedTree.push(...Utils.flattenTree(nodes[i]))
						}

						const parent = flattenedTree.find(node => node.id === l.parentID)
						const child = flattenedTree.find(node => node.id === l.childID)

						if (parent !== undefined && child !== undefined) {
							return (
								<line
									onClick={handleLineClick}
									x1={parent.leftOffset + 25}
									y1={parent.topOffset + 12}
									x2={child.leftOffset + 25}
									y2={child.topOffset + 12}
									className="line"
									id={l.parentID + "-" + l.childID}
									key={l.parentID + "-" + l.childID}
								/>
							)
						}
						return <></>
					})}

					{lineInProgress !== undefined && (
						<line
							onClick={handleLineInProgressClick}
							x1={lineInProgress.src.leftOffset + 25}
							y1={lineInProgress.src.topOffset + 12}
							x2={lineInProgress.mouseX}
							y2={lineInProgress.mouseY}
							className="line"
							key={"mouse-drag-" + lineInProgress.src.id}
						/>
					)}
				</svg>
			</div>
		</div>
	)
}

export default Tree
