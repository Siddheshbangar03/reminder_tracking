// const http = require("http");
// const express = require("express");
// const path = require("path");
// const { Server } = require("socket.io");
// const fs = require("fs");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// // Ensure 'uploads' directory exists
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// let expenses = [];

// // Socket.io connection
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);
  
//   // Send existing expenses to newly connected client
//   socket.emit("load-expenses", expenses);
  
//   socket.on("user-message", async (message) => {
//   console.log(`Received message: ${message}`);

//   try {
//     const expense = JSON.parse(message);
//     let receiptImageUrl = null;

//     const handleImageUpload = async () => {
//       if (expense.receiptImage) {
//         try {
//           const imageBuffer = Buffer.from(expense.receiptImage, "base64");
//           const imageFileName = `${expense.id}_${Date.now()}.jpg`; // Unique with timestamp
//           const imagePath = path.join(uploadDir, imageFileName);

//           await fs.promises.mkdir(uploadDir, { recursive: true });
//           await fs.promises.writeFile(imagePath, imageBuffer);

//           receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}?t=${Date.now()}`;
//           expense.receiptImageUrl = receiptImageUrl;

//           console.log(`Image saved: ${imagePath}`);
//         } catch (err) {
//           console.error("Error saving image in user-message:", err);
//         }
//       }
//     };

//     // Wait for image upload to complete before proceeding
//     await handleImageUpload();
//     delete expense.receiptImage;

//     const existingIndex = expenses.findIndex((e) => e.id === expense.id);

//     if (existingIndex !== -1) {
//       expenses[existingIndex] = expense;
//       console.log(`Updated expense: ${expense.title} (ID: ${expense.id})`);
//     } else {
//       expenses.push(expense);
//       console.log(`Added new expense: ${expense.title} (ID: ${expense.id})`);
//     }

//     // Broadcast the updated expense object with receiptImageUrl
//     io.emit("message", JSON.stringify(expense));
//   } catch (error) {
//     console.error("Error processing message:", error);
//   }
// });


// // In your socket.io update-status handler
// socket.on("update-status", (data) => {
//     console.log(`Received update: ${JSON.stringify(data)}`);
    
//     const expense = expenses.find(e => e.id === data.id);
//     if (expense) {
//         expense.status = data.status;
//         expense.paidBy = data.paidBy;

//         if (!expense.notes) {
//             expense.notes = [];
//         }

//         if (data.newNote) {
//             expense.notes.push({
//                 noteID: data.newNote.noteID, 
//                 note: data.newNote.note,
//                 noteTimeStamp: data.newNote.noteTimeStamp
//             });
//         }

//         if (data.paidDate !== undefined) {
//             expense.paidDate = data.paidDate;
//         }

//         if (data.amount !== undefined) {
//             expense.amount = data.amount;
//         }

//         // Handle image upload with better error handling
//         const handleImageUpload = async () => {
//             if (data.receiptImage) {
//                 try {
//                     const imageBuffer = Buffer.from(data.receiptImage, "base64");
//                     const imageFileName = `${data.id}_${Date.now()}.jpg`; // Add timestamp for uniqueness
//                     const imagePath = path.join(uploadDir, imageFileName);

//                     // Ensure directory exists
//                     await fs.promises.mkdir(uploadDir, { recursive: true });
                    
//                     // Write file
//                     await fs.promises.writeFile(imagePath, imageBuffer);
                    
//                     // Generate URL with cache buster
//                     const receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}?t=${Date.now()}`;
//                     expense.receiptImageUrl = receiptImageUrl;
                    
//                     console.log(`Image saved at: ${imagePath}`);
//                     console.log(`Image URL set to: ${receiptImageUrl}`);
                    
//                     // Emit update with image URL
//                     io.emit('status-updated', {
//                         ...expense,
//                         receiptImageUrl, // Explicitly include in the update
//                         timestamp: Date.now() // Include current timestamp
//                     });
//                 } catch (err) {
//                     console.error("Error saving image:", err);
//                     // Emit without image if there's an error
//                     io.emit('status-updated', expense);
//                 }
//             } else {
//                 // No image to process
//                 io.emit('status-updated', expense);
//             }
//         };
        
//         handleImageUpload();
//     }
// });


//   socket.on("update-expense-approved", (data) => {
//       console.log(`Received Approved: ${JSON.stringify(data)}`);
//       const expense = expenses.find(e => e.id === data.id);
//       if (expense) {
//           expense.isApproved = data.isApproved;
//           console.log(`Approved Expense: ${JSON.stringify(expense)}`);
//       }
//       io.emit('approved-updated', data);
//   });

//   socket.on("delete-expense", (id) => {
//     console.log(`Request to delete expense: ${id}`);
    
//     expenseToDelete = expenses.find( e => e.id === id);
//     // Find and remove the expense
//     const initialLength = expenses.length;
//     expenses = expenses.filter(e => e.id !== id);
    
//     if (expenses.length < initialLength) {
//       console.log(`Deleted expense: ${expenseToDelete?.title || 'Unknown'} (ID: ${id})`);
//       io.emit('expense-deleted', id);
//     } else {
//       console.log(`Expense ID - ${id} not found`)
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected:", socket.id);
//   });
// });

// // Serve static images from uploads folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads"),{
//   setHeaders: (res, path) => {
//     res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//     res.set('Pragma', 'no-cache');
//     res.set('Expires', '0');
//   }}));

//   app.use((err, req, res, next) => {
//   if (err.status === 404) {
//     console.log(`404 for ${req.url}`);
//   }
//   next(err);
// });

// app.use(express.static(path.resolve("./public")));

// app.get("/", (req, res) => {
//   return res.sendFile(path.resolve(__dirname, "public", "index.html"));
// });

// const PORT = process.env.PORT || 9000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require("dotenv").config();
const cloudinary = require("./cloudinary");
const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const fs = require("fs");



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

let expenses = [];

const uploadBase64Image = async (base64String, folder = "expenses") => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64String}`,
      { folder }
    );
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  // Send existing expenses to newly connected client
  socket.emit("load-expenses", expenses);
  
  socket.on("user-message", async (message) => {
  console.log(`Received message: ${message}`);

//   try {
//     const expense = JSON.parse(message);
//     let receiptImageUrl = null;

//     const handleImageUpload = async () => {
//       if (expense.receiptImage) {
//         try {
//           const imageBuffer = Buffer.from(expense.receiptImage, "base64");
//           const imageFileName = `${expense.id}_${Date.now()}.jpg`; // Unique with timestamp
//           const imagePath = path.join(uploadDir, imageFileName);

//           await fs.promises.mkdir(uploadDir, { recursive: true });
//           await fs.promises.writeFile(imagePath, imageBuffer);

//           receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}?t=${Date.now()}`;
//           expense.receiptImageUrl = receiptImageUrl;

//           console.log(`Image saved: ${imagePath}`);
//         } catch (err) {
//           console.error("Error saving image in user-message:", err);
//         }
//       }
//     };

//     // Wait for image upload to complete before proceeding
//     await handleImageUpload();
//     delete expense.receiptImage;

//     const existingIndex = expenses.findIndex((e) => e.id === expense.id);

//     if (existingIndex !== -1) {
//       expenses[existingIndex] = expense;
//       console.log(`Updated expense: ${expense.title} (ID: ${expense.id})`);
//     } else {
//       expenses.push(expense);
//       console.log(`Added new expense: ${expense.title} (ID: ${expense.id})`);
//     }

//     // Broadcast the updated expense object with receiptImageUrl
//     io.emit("message", JSON.stringify(expense));
//   } catch (error) {
//     console.error("Error processing message:", error);
//   }
// });

try {
      const expense = JSON.parse(message);
      if (expense.receiptImage) {
        const url = await uploadBase64Image(expense.receiptImage);
        if (url) expense.receiptImageUrl = url;
        delete expense.receiptImage;
      }

      const index = expenses.findIndex((e) => e.id === expense.id);
      if (index !== -1) {
        expenses[index] = expense;
        console.log(`Updated expense: ${expense.title}`);
      } else {
        expenses.push(expense);
        console.log(`Added new expense: ${expense.title}`);
      }

      io.emit("message", JSON.stringify(expense));
    } catch (error) {
      console.error("Error in user-message:", error);
    }
  });


// In your socket.io update-status handler
// socket.on("update-status", (data) => {
//     console.log(`Received update: ${JSON.stringify(data)}`);
    
//     const expense = expenses.find(e => e.id === data.id);
//     if (expense) {
//         expense.status = data.status;
//         expense.paidBy = data.paidBy;

//         if (!expense.notes) {
//             expense.notes = [];
//         }

//         if (data.newNote) {
//             expense.notes.push({
//                 noteID: data.newNote.noteID, 
//                 note: data.newNote.note,
//                 noteTimeStamp: data.newNote.noteTimeStamp
//             });
//         }

//         if (data.paidDate !== undefined) {
//             expense.paidDate = data.paidDate;
//         }

//         if (data.amount !== undefined) {
//             expense.amount = data.amount;
//         }

//         // Handle image upload with better error handling
//         const handleImageUpload = async () => {
//             if (data.receiptImage) {
//                 try {
//                     const imageBuffer = Buffer.from(data.receiptImage, "base64");
//                     const imageFileName = `${data.id}_${Date.now()}.jpg`; // Add timestamp for uniqueness
//                     const imagePath = path.join(uploadDir, imageFileName);

//                     // Ensure directory exists
//                     await fs.promises.mkdir(uploadDir, { recursive: true });
                    
//                     // Write file
//                     await fs.promises.writeFile(imagePath, imageBuffer);
                    
//                     // Generate URL with cache buster
//                     const receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}?t=${Date.now()}`;
//                     expense.receiptImageUrl = receiptImageUrl;
                    
//                     console.log(`Image saved at: ${imagePath}`);
//                     console.log(`Image URL set to: ${receiptImageUrl}`);
                    
//                     // Emit update with image URL
//                     io.emit('status-updated', {
//                         ...expense,
//                         receiptImageUrl, // Explicitly include in the update
//                         timestamp: Date.now() // Include current timestamp
//                     });
//                 } catch (err) {
//                     console.error("Error saving image:", err);
//                     // Emit without image if there's an error
//                     io.emit('status-updated', expense);
//                 }
//             } else {
//                 // No image to process
//                 io.emit('status-updated', expense);
//             }
//         };
        
//         handleImageUpload();
//     }
// });

    socket.on("update-status", async (data) => {
    const expense = expenses.find((e) => e.id === data.id);
    if (expense) {
      expense.status = data.status;
      expense.paidBy = data.paidBy;

      if (!expense.notes) expense.notes = [];
      if (data.newNote) {
        expense.notes.push({
          noteID: data.newNote.noteID,
          note: data.newNote.note,
          noteTimeStamp: data.newNote.noteTimeStamp,
        });
      }

      if (data.paidDate !== undefined) expense.paidDate = data.paidDate;
      if (data.amount !== undefined) expense.amount = data.amount;

      if (data.receiptImage) {
        const url = await uploadBase64Image(data.receiptImage);
        if (url) expense.receiptImageUrl = url;
      }

      io.emit("status-updated", {
        ...expense,
        timestamp: Date.now(),
      });
    }
  });


  socket.on("update-expense-approved", (data) => {
      console.log(`Received Approved: ${JSON.stringify(data)}`);
      const expense = expenses.find(e => e.id === data.id);
      if (expense) {
          expense.isApproved = data.isApproved;
          console.log(`Approved Expense: ${JSON.stringify(expense)}`);
      }
      io.emit('approved-updated', data);
  });

  socket.on("delete-expense", (id) => {
    console.log(`Request to delete expense: ${id}`);
    
    expenseToDelete = expenses.find( e => e.id === id);
    // Find and remove the expense
    const initialLength = expenses.length;
    expenses = expenses.filter(e => e.id !== id);
    
    if (expenses.length < initialLength) {
      console.log(`Deleted expense: ${expenseToDelete?.title || 'Unknown'} (ID: ${id})`);
      io.emit('expense-deleted', id);
    } else {
      console.log(`Expense ID - ${id} not found`)
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Serve static images from uploads folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads"),{
//   setHeaders: (res, path) => {
//     res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//     res.set('Pragma', 'no-cache');
//     res.set('Expires', '0');
//   }}));

  app.use((err, req, res, next) => {
  if (err.status === 404) {
    console.log(`404 for ${req.url}`);
  }
  next(err);
});

app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
