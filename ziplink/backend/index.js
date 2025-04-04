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

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  // Send existing expenses to newly connected client
  socket.emit("load-expenses", expenses);
  
  socket.on("user-message", (message) => {
    console.log(`Received message: ${message}`);
    
    try {
      // Parse the expense data
      const expense = JSON.parse(message);

      let receiptImageUrl = null;

      // Check if there is an image (base64)
      if (expense.receiptImage) {
        const imageBuffer = Buffer.from(expense.receiptImage, "base64");
        const imageFileName = `${expense.id}.jpg`;
        const imagePath = path.join(uploadDir, imageFileName);

        fs.writeFileSync(imagePath, imageBuffer);
        receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}`;
        expense.receiptImageUrl = receiptImageUrl;
        delete expense.receiptImage;
      }

      // Store only the image URL
      // expense.receiptImageUrl = receiptImageUrl;
      
      
      // Check if the expense already exists
      const existingIndex = expenses.findIndex(e => e.id === expense.id);


      
      if (existingIndex !== -1) {
        // Update existing expense
        expenses[existingIndex] = expense;
        console.log(`Updated expense: Title - ${expense.title} ID - ${expense.id}`);
      } else {
        // Add new expense
        expenses.push(expense);
        console.log(`Added new expense: Title - ${expense.title} ID - ${expense.id}`);
      }
      
      // Broadcast to all clients
      io.emit("message", message);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });



//   socket.on("update-status", (data) => {
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

//         let receiptImageUrl = null;

//       // Check if there is an image (base64)
//       if (data.receiptImage) {
//         const imageBuffer = Buffer.from(data.receiptImage, "base64");
//         const imageFileName = `${data.id}.jpg`;
//         const imagePath = path.join(uploadDir, imageFileName);

//         fs.writeFileSync(imagePath, imageBuffer);
//         receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}`;
//       }

//       // Store only the image URL
//       expense.receiptImageUrl = receiptImageUrl;

//         console.log(`Updated Expense: ${JSON.stringify(expense)}`);
        
//         // Emit the updated status with the modified notes list
//         io.emit('status-updated', expense);
//     }
// });

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

//         let receiptImageUrl = null;

//         // Check if there is an image (base64)
//         if (data.receiptImage) {
//             const imageBuffer = Buffer.from(data.receiptImage, "base64");
//             const imageFileName = `${data.id}.jpg`;
//             const imagePath = path.join(uploadDir, imageFileName);

//             fs.writeFile(imagePath, imageBuffer, (err) => {
//                 if (err) {
//                     console.error("Error saving image:", err);
//                     return;
//                 }
                
//                 // Append timestamp to avoid caching issues
//                 receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}?t=${Date.now()}`;
//                 expense.receiptImageUrl = receiptImageUrl;

//                 console.log(`Updated Expense: ${JSON.stringify(expense)}`);

//                 // Emit the updated status and image to the frontend
//                 io.emit('status-updated', expense);
//                 io.emit('image-updated', { id: expense.id, receiptImageUrl });
//             });
//         } else {
//             // If no new image, just emit the updated expense
//             io.emit('status-updated', expense);
//         }
//     }
// });

socket.on("update-status", (data) => {
    console.log(`Received update: ${JSON.stringify(data)}`);
    
    const expense = expenses.find(e => e.id === data.id);
    if (expense) {
        expense.status = data.status;
        expense.paidBy = data.paidBy;

        if (!expense.notes) {
            expense.notes = [];
        }

        if (data.newNote) {
            expense.notes.push({
                noteID: data.newNote.noteID, 
                note: data.newNote.note,
                noteTimeStamp: data.newNote.noteTimeStamp
            });
        }

        if (data.paidDate !== undefined) {
            expense.paidDate = data.paidDate;
        }

        if (data.amount !== undefined) {
            expense.amount = data.amount;
        }

        // Handle image upload
        const handleImageUpload = async () => {
            let receiptImageUrl = null;
            
            if (data.receiptImage) {
                const imageBuffer = Buffer.from(data.receiptImage, "base64");
                const imageFileName = `${data.id}_${Date.now()}.jpg`; // Add timestamp to filename
                const imagePath = path.join(uploadDir, imageFileName);

                try {
                    await fs.promises.writeFile(imagePath, imageBuffer);
                    receiptImageUrl = `http://localhost:9000/uploads/${imageFileName}`;
                    expense.receiptImageUrl = receiptImageUrl;
                    
                    // Emit update with image URL
                    io.emit('status-updated', {
                        ...expense,
                        timestamp: data.timestamp // Include timestamp
                    });
                } catch (err) {
                    console.error("Error saving image:", err);
                    // Emit without image if there's an error
                    io.emit('status-updated', expense);
                }
            } else {
                // No image to process
                io.emit('status-updated', expense);
            }
        };

        handleImageUpload();
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
app.use("/uploads", express.static(path.join(__dirname, "uploads"),{
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store'); // Disable caching
    fallthrough: false
  }}));

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

















































  // socket.on("update-status", (data) => {
  //   console.log(`Received status update: ${JSON.stringify(data)}`);
    
  //   // Find and update the expense
  //   const expense = expenses.find(e => e.id === data.id);
  //   if (expense) {
  //     expense.status = data.status || "Paid";
  //     console.log(`Updated status for Title - ${expense.title} ID - ${expense.id} to ${expense.status}`);
  //   }
    
  //   // Broadcast the update to all connected clients
  //   io.emit('status-updated', data);
  // });

//   socket.on("update-status", (data) => {
//     console.log(`Received status update: ${JSON.stringify(data)}`);
    
//     // Find and update the expense
//     const expense = expenses.find(e => e.id === data.id);
//     if (expense) {
//         expense.status = data.status || "Paid";
//         expense.note = data.note || "";  // Store the note

//         console.log(`Updated status for Title - ${expense.title} ID - ${expense.id} to ${expense.status} with Note - ${expense.note}`);
//     }
    
//     // Broadcast the update to all connected clients
//     io.emit('status-updated', data);
// });


  // socket.on("update-status", (data) => {
  //     console.log(`Received update: ${JSON.stringify(data)}`);
  //     const expense = expenses.find(e => e.id === data.id);
  //     if (expense) {
  //         expense.status = data.status;
  //         expense.note = data.note;
  //         if(data.paidDate != undefined){
  //         expense.paidDate = data.paidDate;
  //         }
  //         if (data.amount !== undefined) {
  //             expense.amount = data.amount;
  //         }
  //         console.log(`Updated Expense: ${JSON.stringify(expense)}`);
  //     }
  //     io.emit('status-updated', data);
  // });
