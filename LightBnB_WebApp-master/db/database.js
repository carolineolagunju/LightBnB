const { Pool } = require('pg');
//object that connects to the lighbnb database
const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});



///users

//Get a single user from the database given their email.
const getUserWithEmail = function(email) {
  return pool
    //using parameterized query to avoid SQL injection
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      //checking if the provided email does not exist in the db
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err);
    });
};



//Get a single user from the database given their id.
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users where id = $1`, [id])
    .then((result) => {
      //checking if the user id does not exist
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};



//Add a new user to the database.
const addUser = function(user) {
  return pool
    //query to add new user and return the user object
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`, [user.name, user.email, user.password])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};



/// Reservations

//Get all reservations for a single user.
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2`, [guest_id, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};



/// Properties

//Get all properties

const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  //filtering by city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  // Filtering by owner_id
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `WHERE owner_id = $${queryParams.length} `;
  }

  // Filtering by price range
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    if (queryParams.length === 0) {
      queryString += `WHERE `;
    } else {
      queryString += `AND `;
    }
    queryParams.push(options.minimum_price_per_night * 100);// Convert to cents
    queryParams.push(options.maximum_price_per_night * 100);// Convert to cents
    queryString += `cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length} `;
  }

  // Filtering by minimum_rating
  if (options.minimum_rating) {
    if (queryParams.length === 0) {
      queryString += `WHERE `;
    } else {
      queryString += `AND `;
    }
    queryParams.push(options.minimum_rating);
    queryString += `rating >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // Execute the query using the database connection pool and return the result rows
  return pool.query(queryString, queryParams).then((res) => {
    return res.rows;
  })
    .catch((err) => {
      console.log(err.message);
    });
};



//Add a property to the database

const addProperty = function(property) {
  return pool
    .query(`INSERT INTO properties (
  owner_id,
  title,
  description,
  thumbnail_photo_url,
  cover_photo_url,
  cost_per_night,
  street,
  city,
  province,
  post_code,
  country,
  parking_spaces,
  number_of_bathrooms,
  number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *`,
    [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
    .then(result => {
      return result.rows[0];
    })
    .catch(err => {
      console.log(err);
    });
};


module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};