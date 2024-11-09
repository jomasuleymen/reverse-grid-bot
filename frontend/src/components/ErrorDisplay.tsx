import { Alert, List, Typography } from 'antd'
import React from 'react'

interface ValidationError {
  property: string
  constraints: string[]
}

interface ErrorResponse {
  statusCode: number
  message: string
  validationErrors?: ValidationError[]
}

const ErrorDisplay: React.FC<{ error: ErrorResponse; className?: string }> = ({
  error,
  className,
}) => {
  const errorMessage = error.message
  const validationErrors = error?.validationErrors || []

  return (
    <Alert
      message={errorMessage}
      showIcon
      className={className}
      description={
        Array.isArray(validationErrors) &&
        validationErrors.length > 0 && (
          <List
            dataSource={validationErrors}
            renderItem={(item) => (
              <List.Item style={{ paddingTop: 10, paddingBottom: 10 }}>
                <Typography.Text strong>{item.property}:</Typography.Text>
                <List
                  dataSource={item.constraints}
                  rootClassName="p-0"
                  renderItem={(constraint) => (
                    <List.Item style={{ padding: 0 }}>
                      <Typography.Text type="danger">{constraint}</Typography.Text>
                    </List.Item>
                  )}
                />
              </List.Item>
            )}
          />
        )
      }
      type="error"
    />
  )
}

export default ErrorDisplay
