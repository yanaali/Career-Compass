variable "region" {
  type    = string
  default = "ca-central-1"
}
variable "name" {
  type    = string
  default = "career-compass"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,19}$", var.name))
    error_message = "Use 3-20 lowercase letters, numbers, and hyphens; start with a letter."
  }
}
variable "domain_name" {
  type        = string
  description = "Public app hostname, e.g. compass.example.com."
}
variable "certificate_arn" {
  type        = string
  description = "Validated ACM certificate in this region covering domain_name."
}
variable "ai_secret_arn" {
  type        = string
  description = "Existing Secrets Manager secret with JSON keys openai_api_key and service_token. Use the default Secrets Manager KMS key."
}
variable "web_image" {
  type        = string
  description = "Full ECR image URI/tag or digest for Dockerfile.web."
}
variable "api_image" {
  type        = string
  description = "Full ECR image URI/tag or digest for backend/Dockerfile."
}
variable "ai_image" {
  type        = string
  description = "Full ECR image URI/tag or digest for ai-service/Dockerfile."
}
variable "enable_service" {
  type        = bool
  default     = false
  description = "Set true only after building/pushing images and configuring DNS and the AI secret."
}
variable "openai_model" {
  type    = string
  default = "gpt-4o-mini"
}
