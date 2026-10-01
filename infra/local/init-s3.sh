#!/bin/sh
set -eu
awslocal --endpoint-url="$S3_ENDPOINT" s3api head-bucket --bucket career-compass-local 2>/dev/null || \
  awslocal --endpoint-url="$S3_ENDPOINT" s3api create-bucket --bucket career-compass-local --region ca-central-1 --create-bucket-configuration LocationConstraint=ca-central-1
awslocal --endpoint-url="$S3_ENDPOINT" s3api put-public-access-block --bucket career-compass-local --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
