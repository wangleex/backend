class QueryNode {
    constructor(name, inputs, output, children, selected = false) {
		this.name = name; // The 'Name' of this query node. It is a context sensitive name to refer to its name relative to its parent
        this.inputs = inputs;  // Input[], inputs to thise node
        this.output = output;  // Output, the type of output of this node
        this.children = children; // QueryNode[], children of thise node
        this.selected = selected; // Whether this node was selected
    }

	static isValidQuery(queryNode){
		if(!queryNode || !queryNode.selected){
			return false;
		}

		if(queryNode.output.isScalar){
			return true;
		}
		
		// If this node is selected and it's not a scalar, check its children
		let childrenAreValid = false;
		queryNode.children.forEach((child) => {
			childrenAreValid = childrenAreValid || QueryNode.isValidQuery(child)
		});

		return childrenAreValid;
	}

	toGraphQLQueryString(){
		if(!QueryNode.isValidQuery(this)){
			return "";
		}

		let query = {string: this.name} 
		
		if(this.inputs.length > 0){
			query.string += "(";
			this.inputs.forEach((input, index, inputs) => {
				if(input.inputType == 'String'){
					if(input.value){
						query.string += input.name + ":" + (input.value ?  JSON.stringify(input.value) : '""');
						if(index != inputs.length - 1){
							query.string += ", "
						}
					}
				} else {
					query.string += input.name + ":" + input.value
						if(index != inputs.length - 1){
							query.string += ", "
						}
				} 

			});
			query.string += ") ";
		}
	
		if(this.children.length > 0){
			query.string += "{ "

			this.children.forEach((child) => {
				if(QueryNode.isValidQuery(child) && child.selected){
					query.string += child.toGraphQLQueryString() + " ";	
				}
			});
			query.string += "} "
		}

		return query.string;
	}

}


module.exports = QueryNode;