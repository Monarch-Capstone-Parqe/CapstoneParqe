import database as db

# Loop until user wishes to exit using the 0 code
while True:
    # Basic header printing
    print()
    print(f'---------------------------')
    print(f'[1] | Add Staff Member:\n[2] | Remove Staff Member:\n[0] | Exit Program:')
    print(f'---------------------------')
    operation = input(f'Please enter the number of the operation you would like to perform: ')
    print()

    # Try-Catch for operation integer casting
    try:
        operation = int(operation)
        match operation:
            # Close script
            case 0:
                print(f'Exiting...')
                exit(0)
            # Add email to Staff Table
            case 1:
                email = input("Please enter the email of the staff member you would like to add [example@pdx.edu]:") 
                ret = db.add_staff_member(email)

                if ret:
                    print(f'[SUCCESS] | {email} has been added to the "Staff" table...')
                else:
                    print(f'[FAILURE] | {email} is already in the "Staff" table...')
            # Remove email from Staff Table
            case 2:
                email = input("Please enter the email of the staff member you would like to remove [example@pdx.edu]:")
                ret = db.remove_staff_member(email)

                if ret:
                    print(f'[SUCCESS] | {email} has been removed from the "Staff" table...')
                else:
                    print(f'[FAILURE] | {email} is not in the "Staff" table...')
            # Unknown Operator
            case _:
                print(f'[ERR] | Operation not recognized. Please use the leftmost index number when selecting an operation...')
    except ValueError:
        print(f'[ERR] | Operation not recognized. Please use the leftmost index number when selecting an operation...')

