/**
 * パスワード入力コンポーネント
 *
 * 表示/非表示切り替えボタン付きのパスワード入力欄です。
 * LoginPage と SignupPage で共通利用します。
 */

import { useState } from 'react'
import { HiEye, HiEyeSlash } from 'react-icons/hi2'
import './PasswordInput.css'

/**
 * PasswordInputのProps型定義
 */
interface PasswordInputProps {
  /** input要素のid属性 */
  id: string
  /** 現在の入力値 */
  value: string
  /** 値が変更されたときのコールバック */
  onChange: (value: string) => void
  /** プレースホルダーテキスト */
  placeholder?: string
  /** autocomplete属性の値 */
  autoComplete?: string
  /** CSSクラス名のプレフィックス（login, signup など） */
  classPrefix: string
  /** エラーメッセージ（表示する場合） */
  error?: string
}

/**
 * パスワード入力コンポーネント
 *
 * @param props - PasswordInputのprops
 * @returns パスワード入力欄のJSX要素
 *
 * 使用例:
 * ```tsx
 * <PasswordInput
 *   id="password"
 *   value={password}
 *   onChange={setPassword}
 *   autoComplete="current-password"
 *   classPrefix="login"
 *   error={fieldErrors.password}
 * />
 * ```
 */
const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  classPrefix,
  error,
}) => {
  // パスワードの表示/非表示を管理
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`${classPrefix}-field`}>
      <label htmlFor={id} className={`${classPrefix}-label`}>
        パスワード
      </label>
      <div className="password-input-wrapper">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${classPrefix}-input`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-input-toggle"
          aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
        >
          {showPassword ? <HiEyeSlash /> : <HiEye />}
        </button>
      </div>
      {/* エラーメッセージ */}
      {error && (
        <div className={`${classPrefix}-field-error`}>
          {error}
        </div>
      )}
    </div>
  )
}

export default PasswordInput
