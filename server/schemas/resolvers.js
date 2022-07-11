const { AuthenticationError } = require("apollo-server-express");
const { Category, Course, Order, User } = require("../models");
const { populate } = require("../models/User");
const stripe = require("stripe")("sk_test_4eC39HqLyjWDarjtT1zdp7dc");

const resolver = {
	Query: {
		categories: async () => {
			const categories = Category.find().sort({ createdAt: -1 });
			return categories;
		},
		checkout: async (parent, args, context) => {
			console.log(context.headers.referer);
			const url = new URL(context.headers.referer).origin;
			const order = new Order({ courses: args.courses });
			const { courses } = await order.populate("courses");

			const line_items = [];

			for (let i = 0; i < courses.length; i++) {
				// generate product id
				const course = await stripe.products.create({
					name: courses[i].name,
					description: courses[i].description,
					// images: [`${url}/images/${products[i].image}`],
				});

				// generate price id using the product id
				const price = await stripe.prices.create({
					product: course.id,
					unit_amount: courses[i].price * 100,
					currency: "usd",
				});

				// add price id to the line items array
				line_items.push({
					price: price.id,
					quantity: 1,
				});
			}

			const session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				line_items,
				mode: "payment",
				success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${url}/`,
			});

			return { session: session.id };
		},
		courses: async () => {
			const courses = Course.find().sort({ createdAt: -1 });
			return courses;
		},
		me: async (parent, args) => {
			const userData = await User.findOne({}).select("-__v -password");

			return userData;
		},
		order: async (parent, { _id }) => {
			const order = Order.findOne({ _id }).populate("courses");
			return order;
		},
		orders: async () => {
			const orders = Order.find()
				.sort({ createdAt: -1 })
				.populate("products");
			return orders;
		},
		user: async (parent, { _id }) => {
			const user = User.findOne({ _id }).populate({
				path: "orders",
				populate: {
					path: "products",
				},
			});
			return user;
		},
		users: async () => {
			const users = User.find()
				.sort({ createdAt: -1 })
				.populate({
					path: "orders",
					populate: {
						path: "products",
					},
				});
			return users;
		},
	},
	Mutation: {
		addUser: async (parent, args) => {
			const user = await User.create(args);
			const token = signToken(user);

			return { token, user };
		},
		addOrder: async (parent, { products }) => {
			const order = await User.create({ products });
			return { order };
		},
		login: async (parent, { email, password }) => {
			const user = await User.findOne({ email });

			if (!user) {
				throw new AuthenticationError("Incorrect Email");
			}

			const correctPw = await user.isCorrectPassword(password);

			if (!correctPw) {
				throw new AuthenticationError("Incorrect Password");
			}

			const token = signToken(user);

			return { token, user };
		},
	},
};

module.exports = resolver;
