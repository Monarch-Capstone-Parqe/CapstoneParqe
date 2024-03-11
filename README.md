# CapstonePARQE


# Table of Contents
1. [Introduction](#intro)
   1. [Project Description](#projectDesc)
   2. [Project Details](#projectDetails)
   3. [Capstone Team](#capstoneTeam)
2. [How to Set Up Development Environment ](#Set)
   1. [Set Up with Windows](#setupWindow)
   2. [Set Up with Linux](#setupLinux)
3. Conclusion


# Introduction <a name="intro"></a>

Welcome to the Portland State University Capstone Project, brought to you by Team Monarch. 
This initiative focuses on the development of the PrusaSlicer Automated Routing and Quoting Engine (PARQE) for Portland State University.

For detailed documentation, refer to [PARQE Document]().

## Project Description <a name="projectDesc"></a>

**Objective:**
The primary objective of this project is to revolutionize the 3D printing submission workflow within the Portland State University Electronics Prototyping Lab. 
Through the implementation of the PrusaSlicer Automated Routing and Quoting Engine (PARQE), we aim to introduce modernization and automation to the existing processes.

**Key Goals:**
- Streamline the design-to-prototype journey for students.
- Enhance the efficiency of 3D printing submissions.
- Integrate seamlessly with PrusaSlicer and OctoPrint for optimal functionality.
- Provide a user-friendly interface for both students and staff.

This capstone project, led by Team Monarch, is poised to make a significant impact on the Electronics Prototyping Lab, fostering innovation and efficiency in the realm of 3D printing at Portland State University.


## Project Details <a name="projectDetails"></a>
The project consists of 5 main componets:

1. [User Interface](#UserApi)
2. [Staff Interface](#StaffApi)
3. [Backend](#Backend)
4. [Octoprint](#Octo)
5. [Database](#Database)

---
### *User API* <a name="UserApi"></a>
#### Purpose:
The User webpage/API is the interface in which a user interacts with PARQE in order to submit a 3d model for printing. Here the user can upload a 3d model in .stl, .3mf, .stp, or .step format and configure key print settings to ensure an optimal print. Default settings are selected by default in order to make the software accessible for users of all experience levels. Users will also have the option to include important details about their print for the staff to review and consider. This user facing API also has a built in dark/light mode switch to offer some stylistic customization to match the user's workspace.

#### Functionality:
The API consists of a submission form with the following field:

   **Email:** 
   - The users email. Allows for identificaiton of user as well as to receive required follow up emails.

   **File:** 
   - The 3d model file in .stl, .3mf, .stp, or .step format.

   **Filament Type:** 
   - This field contains an up to date inventory of current filament types and colors in stock in the EPL. The inventory will be able to be edited via the staff API.

   **Nozzle Size:** 
   - Availible nozzle sizes to choose from are 0.4mm and 0.6mm. 0.4mm will be selected by default.

   **Layer Height:** 
   - Layer height options depend on nozzle size selection. A 0.4mm nozzle size selection will have options for 0.2mm (default) and 0.1mm layter heights. A 0.6mm nozzle size selection will have options for 0.3mm (default) and 0.15mm layer heights.

   **Infill Density:** 
   - Infill density can range from 0% (no infill) to 100% (solid). 20% is selected by default.

   **Quanity:** 
   - This value is for the quantity of prints that the user wants of the uploaded 3d model.
   
   **Note:** 
   - If the user has any additional important information or instructions for their print job that they want the staff to know, they can enter them here.

Upon clicking the submit button on the form, the user will be guided through a series of custom modal windows. The first will have the user review and approve their print configuration. Upon approval, the data will be submitted to the staff API for review. If a succesful response is returned, the user will be notified via a modal window that their print has been submitted succesfully and provide them with next steps. If an error is returned, the user will be notified that there was an error and their print job was not submitted. 

The User API plays a pivotal role in empowering users to interact with the PARQE project efficiently and effectively, facilitating a streamlined workflow from design submission to the final 3D print.

---
### 2) *Staff API* <a name="StaffApi"></a>
#### Purpose:
The Staff API serves as the managerial hub within the PARQE project, facilitating efficient oversight and control over incoming print jobs and the inventory of filaments available to print with.

#### Functionality:
The Staff API encompasses the following key functionalities:

1. **Pending Page:**
   - The Pending Page provides an overview of all print jobs that have been submitted by users through the User API but are awaiting managerial approval.
   - Staff members can review details of each pending job, including user information, design specifications, and proposed print configurations.

2. **Approved Page:**
   - The Approved Page consolidates a list of all print jobs that have received managerial approval. This section serves as a comprehensive record of designs that are ready for the printing process.
   - Staff members can access detailed information about each approved job, ensuring clarity and transparency in the workflow.

3. **Denied Page:**
   - The Denied Page displays a catalog of print jobs that have been rejected by managerial review. This section provides insights into the reasons for denial and offers an opportunity for staff to communicate feedback to users.
   - Staff members can access relevant details and communicate denial reasons, fostering effective collaboration between staff and users.

4. **Filament Inventory Page:**
   - The Filament Inventory Page displays an inventory of all filament types present in the database
   - Staff members can add new filament types, indicate whether existing filament types are in stock, and adjust what colors are available for each filament type.
   - Updates from this page are communicated to the backend and reflected on the user page immediately. 

#### Workflow:
1. **Pending Page Review:**
   - Staff members log in to the Staff API and navigate to the Pending Page, where they can assess design submissions pending managerial approval.
   - Each entry provides a summary of user-submitted designs, allowing staff to make informed decisions.

2. **Approval Process:**
   - On the Approved Page, staff members can view and finalize their approvals for designs that meet the required criteria.
   - Detailed information, including print configurations and user details, is accessible for thorough review.

3. **Denial Process:**
   - The Denied Page aids staff in reviewing and documenting reasons for denying specific print jobs.
   - Staff members can provide feedback to users, facilitating a collaborative and constructive approach.

The Staff API streamlines managerial responsibilities, offering a centralized platform for reviewing, approving, and denying print jobs, ultimately contributing to an organized and efficient 3D printing workflow.

---
### 3) *Backend* <a name="Backend"></a>
Related Files
1. file 1
2. file 2
3. file 3
   
#### Purpose:
The Backend component serves as the central hub, orchestrating seamless communication and integration among the various modules of the PARQE project.

#### Functionality:
The Backend is responsible for:
- Efficiently routing data and requests between the User API, Staff API, Octoprint, and Database components.
- Managing the flow of information to ensure timely processing of user submissions, staff approvals, and printing operations.
- Handling file-related operations, such as storage, retrieval, and organization, to support the overall functionality of the system.
- Implementing robust data validation and error handling mechanisms to ensure the reliability of the entire workflow.
- Facilitating real-time updates and notifications between different parts of the system.

This component acts as the backbone of PARQE, ensuring a cohesive and integrated operation throughout the entire project.

---
### 4) *Octoprint* <a name="Octo"></a>

**Purpose:**
OctoPrint serves as the pivotal bridge, connecting the PARQE system to the array of 3D printers within the Portland State University Electronics Prototyping Lab. 
This integral component facilitates communication and control between the PARQE system and the diverse 3D printing infrastructure.

**Functionality:**
- **Printer Connectivity:** OctoPrint establishes and manages connections with all available 3D printers within the lab, ensuring a unified network for streamlined operations.

- **Job Queuing:** It acts as the central hub for managing print job queues, orchestrating the orderly execution of tasks based on managerial approvals and user submissions.

- **Real-time Monitoring:** OctoPrint provides real-time monitoring capabilities, allowing users and staff to track the progress of ongoing print jobs and respond to any issues promptly.

In essence, OctoPrint is the linchpin that harmonizes the PARQE project with the diverse 3D printing resources, enabling a cohesive and efficient workflow in the Electronics Prototyping Lab at Portland State University.

---
### 5) *Database* <a name="Database"></a>

**Purpose:**
The database component plays a pivotal role in storing, managing, and retrieving crucial data integral to the PARQE project's functionality. 
It serves as the centralized repository for various aspects of the 3D printing submission workflow.

**Functionality:**
- **User Data Storage:** The database securely stores user information, preferences, and historical submission data. This ensures a personalized and streamlined experience for users interacting with the PARQE system.

- **Job Records:** Every print job submitted through the User API undergoes meticulous documentation within the database. This includes details such as user submissions, managerial approvals, and denial records, forming a comprehensive history of 3D printing activities.

- **Configuration Settings:** Printing configurations, both user-altered and manager-approved, are stored in the database. This information is seamlessly retrieved during the printing process, ensuring accurate and consistent settings for each job.

- **Audit Trails:** The database maintains detailed logs and audit trails, providing transparency into system activities. This feature aids troubleshooting, analytics, and overall system performance evaluation.

In summary, the Database component acts as the reliable foundation, ensuring data integrity and accessibility throughout the PARQE project, thereby contributing significantly to the streamlined and efficient 3D printing workflow at Portland State University's Electronics Prototyping Lab.

---
## Capstone Team <a name="capstoneTeam"></a>
List of Capstone teams and members who have participated in the development of PARQE project
1. Team Monarch (Fall-Winter 2023-24)
   - Team Lead: Michael Do
   - Team Members:
     - Fairuz Mohamad Yusuf
     - Ryan Niiya
     - Jordan
     - Andrew
     - David
     - Matthew Mahnke
     - Alan
2. TBA
   - Team Lead: N/A
   - Team Members: N/A


# Guide
# How to Set Up Development Environment <a name="Set"></a>
> [!NOTE]
> It is recommended for developers to develop on Windows and Linux (Mac is not recommended due to nuances)

### Required 
1. Version 3.12.2 Python
   - Go to https://www.python.org/downloads/ and download Python
   - During installation process ensure that "Add python.exe to PATH" is checked.
3. Latest Version of Git
   - Go to https://git-scm.com/book/en/v2/Getting-Started-Installing-Git and follow instructions to install Git
4. IDE
   - Microsoft Visual Studios
   - Visual Studios code
   - JetBrains
   - 
## Window <a name="setupWindow"></a>
> [!NOTE]
> Developers can setup local branch however they see fit. This is a barebones basic branch creation.
### Setting Up Local Branch
1. Create local folder
2. Open Git Bash and navivagte to previoursly created folder
3. Once in desided directory, clone repo
```
git clone https://github.com/Monarch-Capstone-Parqe/CapstoneParqe.git
```
![image](https://github.com/Monarch-Capstone-Parqe/CapstoneParqe/assets/92550433/4d358630-2db6-4cf4-9e4b-740cb7ad757c)

4. Create development branch
```
git checkout (master branch)
git pull
git checkout -b <branch-name>
git push --set-upstream origin <branch name>
```

![image](https://github.com/Monarch-Capstone-Parqe/CapstoneParqe/assets/92550433/086854e3-aa84-44b4-9523-ec4c322462ef)

5. 

## Linux <a name="setupLinux"></a>
```
git checkout (master branch)
git pull
git checkout -b <branch-name>
git push --set-upstream origin <branch name>
```

# PARQE Project Setup Guide

1. **Clone PARQE repository**
   - Run the following command in your terminal:
     ```bash
     git clone {url}
     ```

2. **Navigate to Setup Directory**
   - Change into the setup directory:
     ```bash
     cd CapstoneParqe/setup
     ```

3. **Run Setup Script**
   - Execute the setup script (you may need to make it executable before running):
     ```bash
     chmod +x setup.sh
     ./setup.sh
     ```

4. **Return to Main Folder**
   - Go back to the main project folder:
     ```bash
     cd ..
     ```

5. **Create Uploads Folder**
   - Create the 'uploads' folder:
     ```bash
     mkdir uploads
     ```

6. **Run the Application**
   - Start the application:
     ```bash
     python3 app.py
     ```

7. **Database Connection and Manual Manipulation**
   - Connect to PostgreSQL as the superuser:
     ```bash
     sudo -u postgres psql
     ```

   - Connect to the PARQE database:
     ```sql
     \c parqe
     ```

   - Display all tables in PARQE:
     ```sql
     \d
     ```

   - From here, you can use normal SQL commands to manipulate the database.
