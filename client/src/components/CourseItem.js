import React from "react";
import { Link } from "react-router-dom";
import { useStoreContext } from "../utils/GlobalState";
import { ADD_TO_CART, UPDATE_CART_QUANTITY,  REMOVE_FROM_CART } from "../utils/actions";
import { idbPromise } from "../utils/helpers";

function CourseItem(item) {
	const [state, dispatch] = useStoreContext();

	const {
		image,
		name,
		_id,
		price
	} = item;

	const { cart } = state

	const addToCart = () => {
		const itemInCart = cart.find((cartItem) => cartItem._id === _id)
		if (itemInCart) {
			dispatch({
				type: UPDATE_CART_QUANTITY,
				_id: _id,
				purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1
			});
			idbPromise('cart', 'put', {
				...itemInCart,
				purchaseQuantity: parseInt(itemInCart.purchaseQuantity) + 1
			});
		} else {
			dispatch({
				type: ADD_TO_CART,
				course: { ...item, purchaseQuantity: 1 }
			});
			idbPromise('cart', 'put', { ...item, purchaseQuantity: 1 });
		}
	}

	const removeFromCart = () => {
		dispatch({
			type: REMOVE_FROM_CART,
			_id: item._id,
		});

		idbPromise('cart', 'delete', { ...item });
	};

	return (
		<div className="card px-1 py-1">
			<Link to={`/courses/${_id}`}>
				<img
					alt={name}
					src={`/images/${image}`}
				/>
				<p>{name}</p>
			</Link>
			<div>
				<span>${price}</span>
			</div>
			<div>
			<button onClick={addToCart}>Add to cart</button>
			<button onClick={removeFromCart}>Remove from cart</button>
			</div>
		</div>
	);
}

export default CourseItem;