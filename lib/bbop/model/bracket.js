/* 
 * Package: bracket.js
 * 
 * Namespace: bbop.model.bracket.graph
 * 
 * Purpose: An extension of <bbop.model.graph> to produce a bracketed
 * layout (like the neighborhood view in AmiGO 1.8).
 * 
 * TODO: A work in progress...
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.model == "undefined" ){ bbop.model = {}; }
if ( typeof bbop.model.bracket == "undefined" ){ bbop.model.bracket = {}; }
//if ( typeof bbop.model.bracket.graph == "undefined" ){ bbop.model.bracket.graph = {}; }

/*
 * Namespace: bbop.model.bracket.graph
 * 
 * Constructor: bracket
 * 
 * Extension of <bbop.model.graph>
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  this
 */
bbop.model.bracket.graph = function(){
    bbop.model.graph.call(this);
    this._is_a = 'bbop.model.bracket.graph';

    var anchor = this;
    var each = bbop.core.each;
    anchor._logger.DEBUG = true;
    function ll(str){ anchor._logger.kvetch(str); }

    /*
     * Function: bracket_layout
     *
     * Largely borrowed from ChewableGraph.pm from the perl section on
     * AmiGO 2.
     * 
     * Produces a simple bracketed layout based on the maximum
     * distance from the node-of-interest to all other nodes. It also
     * includes direct children as the last row. Useful in some layout
     * contexts.
     *
     * Any node in a properly made graph should be fine, but for the
     * usual end case, see <rich_bracket_layout>.
     * 
     * Parameters: 
     *  term_acc - node of interest
     *
     * Returns: 
     *  list of lists or id strings [[id1, id2], ...]
     */
    this.bracket_layout = function(term_acc){
	
	// // This is the actual path climbing agent.
	// function max_info_climber(in_curr_term, in_curr_term_dist,
	// 			  in_max_hist, in_enc_hist){

	//     // We either bootstrap (first run) or pull them in.
	//     var curr_term = in_curr_term || term_acc;
	//     var curr_term_distance = in_curr_term_dist || 0;
	//     var max_hist = in_max_hist || {};
	//     var encounter_hist = in_enc_hist || {};

	//     // ll('looking at: ' + curr_term + ' at ' + curr_term_distance);

	//     // Only recur if our encounter history sez that either
	//     // this node is new or if we have a higher distance count
	//     // (in which case we add it and continue on our merry
	//     // way).
	//     if( ! bbop.core.is_defined(encounter_hist[curr_term]) ){
	// 	// ll(curr_term + ' is a new encounter at distance ' +
	// 	//    curr_term_distance);

	// 	// Note that we have encountered this node before.
	// 	encounter_hist[curr_term] = 1;

	// 	// Our first distance is the current one!
	// 	max_hist[curr_term] = curr_term_distance;

	// 	// Increment our distance.
	// 	curr_term_distance++;

	// 	// Take a look at all the parents of our current term.
	// 	each(anchor.get_parent_nodes(curr_term),
	// 	     function(p){
	// 		 // Since this is a new node encounter, let's
	// 		 // see what else is out there to discover.
	// 		 max_info_climber(p.id(), curr_term_distance,
	// 				  max_hist, encounter_hist);
	// 	     });

	//     }else if( encounter_hist[curr_term] ){
	// 	// ll(curr_term + ' has been seen before');

	// 	// If we're seeing this node again, but with a
	// 	// separate history, we'll add the length or our
	// 	// history to the current, but will not recur in any
	// 	// case (we've been here before).
	// 	if( max_hist[curr_term] < curr_term_distance ){
	// 	    // ll(curr_term +' has a new max of '+ curr_term_distance);
	// 	    max_hist[curr_term] = curr_term_distance;
	// 	}
	//     }

	//     // Return the collected histories.
	//     return max_hist;
	// }

	// This is the actual path climbing agent.
	function max_info_climber(in_curr_list, in_curr_term_dist,
				  in_max_hist, in_enc_hist){

	    // We either bootstrap (first run) or pull them in.
	    var curr_list = in_curr_list || [];
	    // curr_list must be a list.
	    if( ! bbop.core.is_array(curr_list) ){ curr_list = [curr_list]; }
	    var curr_term_distance = in_curr_term_dist || 0;
	    var max_hist = in_max_hist || {};
	    var encounter_hist = in_enc_hist || {};

	    function update_info_for(update_item, update_distance){
		if( ! encounter_hist[update_item] ){
		    // ll('first time encountering: ' +
		    //    update_item + ', @:' + update_distance);
		    // Note that we have encountered this node before.
		    encounter_hist[update_item] = 1;
		    // Our first distance is the current one!
		    max_hist[update_item] = update_distance;
		}else{
		    // ll('have seen before: ' + update_item + '...' +
		    //    max_hist[update_item] + '/' + update_distance);
		    // If we're seeing this node again, but with a
		    // separate history, we'll add the length or our
		    // history to the current, but will not recur in
		    // any case (we've been here before).
		    if( max_hist[update_item] < update_distance ){
			// ll('   new high at current: ' + update_distance);
			max_hist[update_item] = update_distance;
		    }else{
			// ll('   keeping current: ' + max_hist[update_item]);
		    }
		}
	    }

	    // //
	    // ll('new set @' + curr_term_distance + ' looks like: ' +
	    //    bbop.core.dump(curr_list));

	    // Only work if we have things in our list.
	    if( curr_list && curr_list.length > 0 ){

		// Process everything in the list.
		each(curr_list,
		     function(item){
			 update_info_for(item, curr_term_distance);
		     });

		// Collect the parents of everything in the list.
		var next_round = {};
		each(curr_list,
		     function(item){
			 each(anchor.get_parent_nodes(item),
			      function(p){
				  var pid = p.id();
				  next_round[pid] = true;
			      });
		     });
		var next_list = bbop.core.get_keys(next_round);

		// Increment our distance.
		curr_term_distance++;

		// //
		// ll('future @' + curr_term_distance + ' looks like: ' +
		//    bbop.core.dump(next_list));

		// Recur on new parent list.
		max_info_climber(next_list, curr_term_distance,
				 max_hist, encounter_hist);
	    }

	    // Return the collected histories.
	    return max_hist;
	}

	// A hash of the maximum distance from the node-in-question to
	// the roots.
	var max_node_dist_from_root = max_info_climber(term_acc);
	// ll('max_node_dist_from_root: ' +
	//    bbop.core.dump(max_node_dist_from_root));

	///
	/// Convert this into something like brackets.
	///

	// First, invert hash.
	// E.g. from {x: 1, y: 1, z: 2} to {1: [x, y], 2: [z]} 
	var lvl_lists = {};
	each(max_node_dist_from_root,
	    function(node_id, lvl){
		// Make sure that level is defined before we push.
		if( ! bbop.core.is_defined(lvl_lists[lvl]) ){
		    lvl_lists[lvl] = [];
		}

		lvl_lists[lvl].push(node_id);
	    });
	// ll('lvl_lists: ' + bbop.core.dump(lvl_lists));

	// Now convert the level-keyed hash into an array of arrays.
	// E.g. from {1: [x, y], 2: [z]} to [[x, y], [z]]
	var bracket_list = [];
	var levels = bbop.core.get_keys(lvl_lists);
	levels.sort(bbop.core.numeric_sort_ascending);
	// ll('levels: ' + bbop.core.dump(levels));
	each(levels,
	    function(level){
		var bracket = [];
		each(lvl_lists[level],
		     function(item){
			 bracket.push(item);
		     });
		bracket_list.push(bracket);
	    });
	bracket_list.reverse(); // ...but I want the opposite
	// ll('bracket_list: ' + bbop.core.dump(bracket_list));

	// Well, that takes care of the parents, now lets do the
	// trivial task of adding all of the kids (if any).
	var c_nodes = anchor.get_child_nodes(term_acc);
	// Only add another level when there are actually kids.
	if( c_nodes && ! bbop.core.is_empty(c_nodes) ){ 
	    var kid_bracket = [];
	    each(c_nodes,
		 function(c){
		     kid_bracket.push(c.id());
		 });
	    bracket_list.push(kid_bracket);
	}

	return bracket_list;
    };

    /*
     * Function: relation_weight
     *
     * A GO-specific take on the relative importance of relations in a
     * graph.
     * 
     * Parameters: 
     *  predicate_acc - as string
     *  default_weight - *[optional]* as numbrt
     *
     * Returns: 
     *  relative weight of predicate as number; defaults to 0
     */
    this.relation_weight = function(predicate_acc, default_weight){

	var rel = predicate_acc || '';
	var dflt = default_weight || 0;
	var order = {
	    'is_a': 1,
	    'is a': 1,
	    'has_part': 2,
	    'has part': 2,
	    'part_of': 3,
	    'part of': 3,
	    'regulates': 4,
	    'negatively_regulates': 5,
	    'negatively regulates': 5,
	    'positively_regulates': 6,
	    'positively regulates': 6,
	    'occurs_in': 7,
	    'occurs in': 7
	};

	var ret_weight = dflt;
	if( bbop.core.is_defined(rel) &&
	    rel &&
	    bbop.core.is_defined(order[rel]) ){
	    ret_weight = order[rel];
	}

	return ret_weight;
    };

    /*
     * Function: dominant_relationship
     *
     * Given a bunch of relationships, return the one that is more
     * "dominant".
     * 
     * A GO-specific take on the relative importance of relations in a
     * graph.
     * 
     * Parameters: 
     *  whatever - predicate acc, or lists of lists them...whatever
     *
     * Returns: 
     *  string acc of the dominant relationship or null
     * 
     * See also:
     *  <relationship_weight>
     */
    this.dominant_relationship = function(){

	// Collect all of the relations, recursively unwinding as
	// necessary to get to the end of the arguments/lists of
	// predicate accs.
	// WARNING: Do /not/ try to refactor this for loop--see the
	// documentation for each for the reason.
	var all_rels = [];
	for( var dri = 0; dri < arguments.length; dri++ ){
	    var arg = arguments[dri];
	    //ll('ARG: ' + arg);
	    if( bbop.core.what_is(arg) === 'array' ){
		// This funny thing is actually "dereferencing" the
		// array one step for the recursion.
		all_rels.push(this.dominant_relationship.apply(this, arg));
	    }else{
		all_rels.push(arg);
	    }
	}
	
	// Sort all of the remaining predicate accs according to
	// relation_weight.
	all_rels.sort(function(a, b){
			  return anchor.relation_weight(b) -
			      anchor.relation_weight(a);
		      });

	// Choose the top if it's there, null otherwise.
	var retval = null;
	if( all_rels.length ){
	    retval = all_rels[0];
	}

	return retval;
    };

    /*
     * Function: rich_bracket_layout
     *
     * Very similar to <bracket_layout>, except that instead of the
     * node id, there is a list of [node_id, node_label, predicate].
     * 
     * This is only reliably producable if the following two condition
     * is met: the transitivity graph is the one made for the node of
     * interest by the GOlr loading engine. This is easy to meet if
     * using GOlr, but probably better to roll your own if you're not.
     * 
     * Also, the relative weight of the relations used is very
     * GO-specific--see <relation_weight>.
     * 
     * Again, heavy borrowing from ChewableGraph.pm from the perl
     * section in AmiGO 2.
     * 
     * Parameters: 
     *  term_acc - node of interest
     *  transitivity_graph - the <bbop.model.graph> for the relations
     *
     * Returns: 
     *  list of lists of lists: [[[id, label, predicate], ...], ...]
     */
    this.rich_bracket_layout = function(term_acc, transitivity_graph){
	
	// First, lets just get our base bracket layout.
	var layout = anchor.bracket_layout(term_acc);

	// So, let's go through all the rows, looking on the
	// transitivity graph to see if we can find the predicates.
	var bracket_list = [];
	each(layout, function(layout_level){
	    var bracket = [];
	    each(layout_level, function(layout_item){
		
		// The defaults for what we'll pass back out.
		var curr_acc = layout_item;
		//var pred_id = 'is_a';
		// BUG/TODO: This is the temporary workaround for
		// incomplete transitivity graphs in some cases:
		// https://github.com/kltm/bbop-js/wiki/TransitivityGraph#troubleshooting-caveats-and-fail-modes
		var pred_id = 'related_to';
		var curr_node = anchor.get_node(curr_acc);
		var label = curr_node.label() || layout_item;
		
		// Now we just have to determine predicates. If we're
		// the one, we'll just use the defaults.
		if( curr_acc == term_acc ){
		    // Default.
		}else{
		    // Since the transitivity graph only stores
		    // ancestors, we can also use it to passively test
		    // if these are children we should be looking for.
		    var trels =
			transitivity_graph.get_predicates(term_acc, curr_acc);
		    if( ! bbop.core.is_empty(trels) ){
			// Not children, so decide which of
			// the returned edges is the best.
			pred_id = anchor.dominant_relationship(trels);
		    }else{
			// Probably children, so go ahead and try and
			// pull the direct parent/child relation.
			var drels = anchor.get_predicates(curr_acc, term_acc);
			if( ! bbop.core.is_empty(drels) ){
			    pred_id = anchor.dominant_relationship(drels);
			}
		    }
		}
		
		// Turn our old layout item into a new-info
		// rich list.
		bracket.push([curr_acc, label, pred_id]);
	    });
	    // Sort alphanum and then re-add to list.
	    bracket.sort(function(a, b){
		if( a[1] < b[1] ){
		    return -1;
		}else if( a[1] > b[1] ){
		    return 1;
		}else{
		    return 0;
		}
	    });
	    bracket_list.push(bracket);
	});
	
	return bracket_list;
    };
};
bbop.core.extend(bbop.model.bracket.graph, bbop.model.graph);
