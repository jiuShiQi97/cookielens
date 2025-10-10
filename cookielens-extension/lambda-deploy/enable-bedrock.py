#!/usr/bin/env python3
"""
Enable Bedrock access for Lambda function
"""

import boto3

def enable_bedrock_access():
    """Enable Bedrock access for Lambda function"""
    print("🔧 Enabling Bedrock access for Lambda function...")
    
    try:
        iam = boto3.client('iam')
        
        # Create Bedrock policy
        bedrock_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "bedrock:InvokeModel"
                    ],
                    "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
                }
            ]
        }
        
        # Create policy
        policy_response = iam.create_policy(
            PolicyName='CookieLensBedrockPolicy',
            PolicyDocument=str(bedrock_policy).replace("'", '"'),
            Description='Policy for CookieLens to access Bedrock Claude model'
        )
        
        policy_arn = policy_response['Policy']['Arn']
        print(f"✅ Created Bedrock policy: {policy_arn}")
        
        # Attach policy to role
        iam.attach_role_policy(
            RoleName='cookielens-lambda-role',
            PolicyArn=policy_arn
        )
        
        print("✅ Attached Bedrock policy to Lambda role")
        print("\n🎉 Bedrock access enabled!")
        print("🧪 You can now test the AI analysis feature.")
        
        return True
        
    except iam.exceptions.EntityAlreadyExistsException:
        print("ℹ️  Policy already exists, attaching to role...")
        try:
            # Get account ID
            sts = boto3.client('sts')
            account_id = sts.get_caller_identity()['Account']
            policy_arn = f"arn:aws:iam::{account_id}:policy/CookieLensBedrockPolicy"
            
            iam.attach_role_policy(
                RoleName='cookielens-lambda-role',
                PolicyArn=policy_arn
            )
            print("✅ Attached existing Bedrock policy to Lambda role")
            return True
        except Exception as e:
            print(f"❌ Failed to attach policy: {e}")
            return False
    except Exception as e:
        print(f"❌ Failed to enable Bedrock access: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Enabling Bedrock access for CookieLens...")
    
    success = enable_bedrock_access()
    if success:
        print("\n✅ Bedrock access enabled successfully!")
        print("🧪 Test your API again to see AI analysis results.")
    else:
        print("\n❌ Failed to enable Bedrock access")
        print("💡 You can manually add Bedrock permissions in AWS Console:")

if __name__ == "__main__":
    main()
