package nativeapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/mail"
	"regexp"
	"strings"

	"github.com/deluan/rest"
	"github.com/navidrome/navidrome/conf"
	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/model"
)

var usernamePattern = regexp.MustCompile(`^\w+$`)

type selfSignupRequest struct {
	Username        string `json:"username"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirmPassword"`
}

func (r *selfSignupRequest) normalize() {
	r.Username = strings.TrimSpace(r.Username)
	r.Name = strings.TrimSpace(r.Name)
	r.Email = strings.TrimSpace(r.Email)
}

func (r selfSignupRequest) validate() *rest.ValidationError {
	errorsMap := make(map[string]string)

	if r.Username == "" {
		errorsMap["username"] = "ra.validation.required"
	} else if !usernamePattern.MatchString(r.Username) {
		errorsMap["username"] = "ra.validation.invalidChars"
	}

	if r.Name == "" {
		errorsMap["name"] = "ra.validation.required"
	}

	if r.Password == "" {
		errorsMap["password"] = "ra.validation.required"
	}

	if r.ConfirmPassword == "" {
		errorsMap["confirmPassword"] = "ra.validation.required"
	} else if r.Password != r.ConfirmPassword {
		errorsMap["confirmPassword"] = "ra.validation.passwordDoesNotMatch"
	}

	if r.Email != "" {
		if _, err := mail.ParseAddress(r.Email); err != nil {
			errorsMap["email"] = "ra.validation.email"
		}
	}

	if len(errorsMap) == 0 {
		return nil
	}
	return &rest.ValidationError{Errors: errorsMap}
}

func (n *Router) selfSignupHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !conf.Server.EnableUserSelfSignup {
			_ = rest.RespondWithError(w, http.StatusForbidden, "Self signup is disabled")
			return
		}

		var payload selfSignupRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			log.Error(r, "invalid signup payload", err)
			_ = rest.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		payload.normalize()
		if validationErr := payload.validate(); validationErr != nil {
			_ = rest.RespondWithJSON(w, http.StatusBadRequest, validationErr)
			return
		}

		user := &model.User{
			UserName:    payload.Username,
			Name:        payload.Name,
			Email:       payload.Email,
			NewPassword: payload.Password,
			IsAdmin:     false,
		}

		id, err := n.ds.User(r.Context()).CreateSelfRegistered(user)
		if err != nil {
			var validationErr *rest.ValidationError
			if errors.As(err, &validationErr) {
				_ = rest.RespondWithJSON(w, http.StatusBadRequest, validationErr)
				return
			}

			log.Error(r, "self signup failed", err)
			_ = rest.RespondWithError(w, http.StatusInternalServerError, "Unable to create account")
			return
		}

		_ = rest.RespondWithJSON(w, http.StatusCreated, map[string]string{"id": id})
	}
}
