const User = require("../models/usermodel");
const Order = require("../models/ordermodel")
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const bcrypt = require("bcrypt")


exports.getadminlogin =async(req,res)=>{
    try {
        if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
        return res.render('admin/login');
    } catch (error) {
        console.log("adminpanel page not found");
        res.status(404).send("page not found")
    }
}

exports.postlogin= async(req,res)=>{
    const {email,password} = req.body;
    try {
        const findadmin =await User.findOne({ email,isAdmin:true });
        if(!findadmin){
           return res.render('admin/login', {
               message: 'admin not found'});
        }
        const checkPassword = await bcrypt.compare(password ,findadmin.password)
       if( !checkPassword){
        console.log("password wrong")
       return res.render("admin/login",{message:"Incorrect password"})
       }
       req.session.admin=findadmin._id;
       res.redirect('/admin/dashboard')
        
    } catch (error) {
        console.error("login found",error);
        res.render("admin/login",{message:"login failed, please try again later "})
    }
}

// exports.getadminpanel =async(req,res)=>{
//     try {
//         if(req.session.admin){
//             const filterType = req.query.filterType || 'yearly'; // Default to 'yearly' if no filter is selected
//     const now = new Date();
//     let startDate;

//     // Determine the start date based on filterType
//     if (filterType === 'yearly') {
//       startDate = new Date(now.getFullYear(), 0, 1); // January 1st of the current year
//     } else if (filterType === 'monthly') {
//       startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of the current month
//     } else if (filterType === 'weekly') {
//       const startOfWeek = now.getDate() - now.getDay(); // Calculate the start of the week
//       startDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek);
//     } else {
//       return res.status(400).send('Invalid filter type');
//     }

//     // Fetch orders based on the startDate
//     const orders = await Order.find({ createdAt: { $gte: startDate } });

//     // Example data for chart
//     const chartData = {
//       labels: ['Order 1', 'Order 2', 'Order 3'], // Replace with actual labels
//       data: orders.map(order => order.totalPrice), // Replace with actual data
//     };

//     res.render('admin/adminhome', {
//       orders,
//       chartData,
//       filterType,
//     });
//         }else{
//             return res.redirect('/admin')
//         }
        
//     } catch (error) {
//         console.log("adminpanel page not found");
//         res.status(404).send("page not found")
//     }
// }

exports.getadminpanel = async (req, res) => {
    try {
      if (req.session.admin) {
        const filterType = req.query.filterType || 'yearly'; // Default to 'yearly'
        const now = new Date();
        let startDate, groupBy, formatLabels;
  
        // Determine the startDate and grouping logic based on filterType
        if (filterType === 'yearly') {
          startDate = new Date(2000, 0, 1); // Orders starting from the year 2000
          groupBy = { $year: '$createAT' }; // Group by year
          formatLabels = (data) => data.map((item) => item._id); // Year numbers
        } else if (filterType === 'monthly') {
          startDate = new Date(now.getFullYear(), 0, 1); // January 1st of the current year
          groupBy = { $month: '$createAT' }; // Group by month
          formatLabels = (data) => {
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return data.map((item) => monthNames[item._id - 1]); // Map month number to name
          };
        } else if (filterType === 'weekly') {
          const startOfWeek = now.getDate() - now.getDay(); // Start of the current week (Sunday)
          startDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek);
          groupBy = { $dayOfWeek: '$createAT' }; // Group by day of the week
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
          formatLabels = (data) => {
            const countsByDay = Array(7).fill(0); // Initialize counts for all 7 days
            data.forEach((item) => {
              countsByDay[item._id - 1] = item.count; // Map counts to correct day (MongoDB $dayOfWeek: Sunday=1)
            });
            return dayNames.map((day, index) => ({
              day,
              count: countsByDay[index]
            }));
          };
        } else {
          return res.status(400).send('Invalid filter type');
        }
  
        // Aggregate orders based on the filterType
        const aggregatedData = await Order.aggregate([
          {
            $match: {
                createAT: { $gte: startDate } // Filter orders from the start date
            }
          },
          {
            $group: {
              _id: groupBy, // Group by the specified field
              count: { $sum: 1 } // Count orders
            }
          },
          {
            $sort: { _id: 1 } // Sort by the group (e.g., year, month, or day)
          }
        ]);
  
        // Prepare chart data
        let labels, data;
        if (filterType === 'weekly') {
          const weeklyData = formatLabels(aggregatedData);
          labels = weeklyData.map((item) => item.day); // Extract day names
          data = weeklyData.map((item) => item.count); // Extract counts
        } else{
            labels = formatLabels(aggregatedData);
          data = aggregatedData.map((item) => item.count);
        }
  
        console.log("Labels:", labels);
        console.log("Data:", data);
  

        const aggregateProductData = await Order.aggregate([
          {
            $unwind: "$orderItems"
          },
          {
            $match: {
                orderStatus: { $in: ["Processed", "Shipped", "Delivered"] } // Match specific statuses
            }
        },
          {
            $lookup: {
              from: "products",
              localField: "orderItems.productId",
              foreignField: "_id",
              as: "productDetails"
            }
          },
          {
            $unwind: "$productDetails"
          },
          {
            $group: {
              _id: "$productDetails.productName", // Group by product name
              totalQuantity: { $sum: "$orderItems.quantity" }
            }
          },
          {
            $sort: { totalQuantity: -1 }
          },
          {
            $limit: 4
          }
        ]);
          

        const aggregateCategoryData = await Order.aggregate([
          {
              $unwind: "$orderItems" // Deconstruct the `orderItems` array
          },
          {
              $match: {
                  orderStatus: { $in: ["Processed", "Shipped", "Delivered"] } // Match specific statuses
              }
          },
          {
              $lookup: {
                  from: "products",
                  localField: "orderItems.productId",
                  foreignField: "_id",
                  as: "productDetails"
              }
          },
          {
              $unwind: "$productDetails" // Flatten the `productDetails` array
          },
          {
              $lookup: {
                  from: "categories",
                  localField: "productDetails.category",
                  foreignField: "_id",
                  as: "categoryDetails"
              }
          },
          {
              $unwind: "$categoryDetails" // Flatten the `categoryDetails` array
          },
          {
              $group: {
                  _id: "$categoryDetails.name", // Group by category name
                  totalQuantity: { $sum: "$orderItems.quantity" } // Sum the quantities
              }
          },
          {
              $sort: { totalQuantity: -1 } // Sort by totalQuantity in descending order
          },
          {
              $limit: 4 // Limit to top 4 categories
          }
      ]);
      
     
  const totalSales = await Order.aggregate([
    {
        $match: {
          orderStatus: { $in: ["Processed", "Shipped", "Delivered"] } // Filter by statuses
        }
    },
    {
        $group: {
            _id: null, // Group all matching orders
            totalSales: { $sum: "$finalAmount" } // Sum the `totalAmount` field
        }
    },
    {
        $project: {
            _id: 0, // Exclude `_id` from the result
            totalSales: 1 // Include `totalSales`
        }
    }
]);

  
    const totalUsers = await User.countDocuments();
    const totalOrder = await Order.countDocuments();
 console.log("result",totalSales)
        res.render('admin/adminhome', {
          chartData: { labels, data },
          filterType,
          aggregateProductData,
          aggregateCategoryData,
          totalUsers,
          totalOrder,
          totalSales
        });
      } else {
        return res.redirect('/admin');
      }
    } catch (error) {
      console.error('Error fetching admin panel data:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  

  


exports.logout = async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("session destruction error",err.message);
                 return res.redirect("/pagenotefound");
            }
            console.log("logout");
            return res.redirect("/admin")           
        })
    } catch (error) {
        console.log("logout error",error);
        res.redirect('/pagenotfound')
    }
}





