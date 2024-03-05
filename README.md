# CapstoneParqe


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
PSU capstone project from team Monarch
Link to more detailed Documentaion [Pareq Document]().

## Project Description <a name="projectDesc"></a>
This capstone project is to develop the PrusaSlicer Automated Routing and Quoting Engine (PARQE). Which aims to modernize and automate the 3D printing submission workflow in the Electronics Prototyping Lab. 

## Project Details <a name="projectDetails"></a>
There are 5 main componets to this project

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

   Email: The users email. Allows for identificaiton of user as well as to receive required follow up emails.

   File: The 3d model file in .stl, .3mf, .stp, or .step format.

   Filament Type: This field contains an up to date inventory of current filament types and colors in stock in the EPL. The inventory will be able to be edited via the staff API.

   Nozzle Size: Availible nozzle sizes to choose from are 0.4mm and 0.6mm. 0.4mm will be selected by default.

   Layer Height: Layer height options depend on nozzle size selection. A 0.4mm nozzle size selection will have options for 0.2mm (default) and 0.1mm layter heights. A 0.6mm nozzle size selection will have options for 0.3mm (default) and 0.15mm layer heights.

   Infill Density: Infill density can range from 0% (no infill) to 100% (solid). 20% is selected by default.

   Quanity: This value is for the quantity of prints that the user wants of the uploaded 3d model.
   
   Note: If the user has any additional important information or instructions for their print job that they want the staff to know, they can enter them here.

Upon clicking the submit button on the form, the user will be guided through a series of custom modal windows. The first will have the user review and approve their print configuration. Upon approval, the data will be submitted to the staff API for review. If a succesful response is returned, the user will be notified via a modal window that their print has been submitted succesfully and provide them with next steps. If an error is returned, the user will be notified that there was an error and their print job was not submitted. 


---
### 2) Staff API <a name="StaffApi"></a>
#### Purpose:
The Staff webpage/API is a manageral webpage which allows staff to view, approve, and deny incomming print jobs. 

#### Functionality:
There are 3 pages 
1. Pending page
2. Approved page
3. Denied page

The pending will be the first page the EPL staff will view. This page list jobs that have been submitted by users through the User API. 

Apporve page will list all proved print jobs

Denied page will list all denied print jobs 

---
### 3) Backend <a name="Backend"></a>
Related Files
1. file 1
2. file 2
3. file 3
   
#### Purpose:
Acts as the glue which allow differnt compenets of the PARQE project to communicate with each other 
#### Functionality:

---
### 4) Octoprint <a name="Octo"></a>

#### Purpose:

#### Functionality:

---
### 5) Database <a name="Database"></a>

#### Purpose:

#### Functionality:

## Capstone Team <a name="capstoneTeam"></a>
List of capstone teams and members who participated in the development of PARQE
1. Team Monarch (Fall-Winter 2023-24)
   - Team Lead: Michael Do
   - Team Memebers: 
2. TBA
   - Team Lead: N/A
   - Team Memebers: N/A



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
3. Once in desided direcoty, clone repo
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
